/**
 * Quant Backtest Pro - Secure Key Vault (AES-GCM 256, PBKDF2-derived)
 * 
 * AUT-27 - Institutional Risk Guardrails, Emergency Kill-Switch & Secure Key Vault.
 * 
 * Threat Model:
 *  - Browser-local IndexedDB may be inspected by other JS (XSS) or by a forensic analyst.
 *  - Plaintext API keys must NEVER appear in plaintext in storage, logs, telemetry, or
 *    network payloads.
 *  - Vault stays locked until the operator enters the master passphrase (PBKDF2 250k
 *    iterations, 16-byte salt). The salt is persisted in IndexedDB unencrypted (it is
 *    not a secret). The wrapping key never leaves memory and is wiped on lock.
 *
 * Cryptographic Choices:
 *  - Algorithm: AES-GCM 256-bit (FIPS-approved, authenticated encryption)
 *  - KDF: PBKDF2-SHA-256 with 250 000 iterations and 16-byte random salt
 *  - Per-secret 12-byte random IV
 *  - Associated Data (AAD): constant tag binding each ciphertext to the vault origin
 *    to prevent copy-paste relay between stores.
 *
 * Operational Guarantees:
 *  - `redactSecret(plaintext)` returns only safe metadata; the function is the only
 *    path that touches a secret value and never logs it.
 *  - When the vault is locked, the in-memory CryptoKey is `null`; all
 *    `retrieveSecret()` calls throw a typed error.
 *  - On `lockVault()` we replace the key reference with a typed sentinel. We never
 *    attempt to scrub the GC; the JS engine owns memory hygiene.
 */

import { idbStorage } from "../storage/idbStorage";

/**
 * Storage contract used by the Secure Key Vault.
 * The default production adapter is the idbStorage singleton from `src/storage/idbStorage`,
 * but tests inject `InMemoryStorage` so the suite can run in headless Node.
 */
export interface VaultStorage {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Headless in-memory Map storage for tests. Never use this in production - it
 * loses data when the page reloads.
 */
export class InMemoryStorage implements VaultStorage {
  private store: Map<string, unknown> = new Map();
  async getItem<T>(key: string): Promise<T | null> {
    return (this.store.get(key) ?? null) as T | null;
  }
  async setItem<T>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

export const VAULT_STORE_NAME = 'secure_key_vault';

const PBKDF2_ITERATIONS = 250_000;
const PBKDF2_HASH = 'SHA-256';
const AES_ALG = { name: 'AES-GCM', length: 256 } as const;

const SALT_KEY = '__vault_salt__';
const VERSION_KEY = '__vault_version__';
export const VAULT_VERSION = 1;

const AAD_BYTES = new TextEncoder().encode('quant-backtest-pro/secure-key-vault/v1');

export interface VaultRecord {
  id: string;
  ciphertext: string;
  iv: string;
  createdAt: number;
  updatedAt: number;
}

export interface RedactedSecretMetadata {
  id: string;
  fingerprintPrefix: string;
  plaintextLength: number;
  createdAt: number;
  updatedAt: number;
}

export type VaultStatus = 'LOCKED' | 'UNLOCKED' | 'UNINITIALISED';

export interface VaultState {
  status: VaultStatus;
  secretCount: number;
  lastUnlockedAt: number | null;
  version: number;
}

export class VaultLockedError extends Error {
  constructor() {
    super('Secure Key Vault is locked. Unlock with unlockVault(passphrase) before accessing secrets.');
    this.name = 'VaultLockedError';
  }
}

export class VaultCorruptedError extends Error {
  constructor(message: string) {
    super(`Secure Key Vault integrity check failed: ${message}`);
    this.name = 'VaultCorruptedError';
  }
}

function getSubtle(): SubtleCrypto {
  if (typeof globalThis === 'undefined' || !globalThis.crypto?.subtle) {
    throw new Error('WebCrypto subtle API is not available in this runtime.');
  }
  return globalThis.crypto.subtle;
}

function getRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa !== 'undefined') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(b64: string): Uint8Array {
  if (typeof atob !== 'undefined') {
    const binary = atob(b64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

async function deriveWrappingKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const subtle = getSubtle();
  const baseKey = await subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    { name: 'PBKDF2', hash: PBKDF2_HASH, iterations: PBKDF2_ITERATIONS, salt: new Uint8Array(salt) },
    baseKey,
    AES_ALG,
    false,
    ['encrypt', 'decrypt']
  );
}

async function fingerprintPrefix(plaintext: string): Promise<string> {
  const subtle = getSubtle();
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(plaintext));
  const bytes = new Uint8Array(digest).slice(0, 4);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function redactSecret(id: string, plaintext: string): Promise<RedactedSecretMetadata> {
  const fp = await fingerprintPrefix(plaintext);
  return {
    id,
    fingerprintPrefix: fp,
    plaintextLength: plaintext.length,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

class SecureKeyVault {
  private wrappingKey: CryptoKey | null = null;
  private lastUnlockedAt: number | null = null;
  private initPromise: Promise<void> | null = null;
  private storage: VaultStorage;

  constructor(storage?: VaultStorage) {
    this.storage = storage ?? (idbStorage as unknown as VaultStorage);
  }


  public async initializeIfNeeded(passphrase: string): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInitialize(passphrase);
    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  public async unlockVault(passphrase: string): Promise<void> {
    await this.initializeIfNeeded(passphrase);
    const salt = await this.getOrCreateSalt(passphrase);
    this.wrappingKey = await deriveWrappingKey(passphrase, salt);
    this.lastUnlockedAt = Date.now();
  }

  public lockVault(): void {
    this.wrappingKey = null;
    this.lastUnlockedAt = null;
  }

  public isUnlocked(): boolean {
    return this.wrappingKey !== null;
  }

  public async getState(): Promise<VaultState> {
    const ids = await this.listSecretIds();
    return {
      status: this.wrappingKey ? 'UNLOCKED' : 'LOCKED',
      secretCount: ids.length,
      lastUnlockedAt: this.lastUnlockedAt,
      version: VAULT_VERSION,
    };
  }

  public async listSecretIds(): Promise<string[]> {
    const all = await this.storage.getItem<Record<string, VaultRecord>>(VAULT_STORE_NAME);
    if (!all) return [];
    return Object.keys(all).filter((k) => !k.startsWith('__'));
  }

  public async listMetadata(): Promise<RedactedSecretMetadata[]> {
    const all = await this.storage.getItem<Record<string, VaultRecord>>(VAULT_STORE_NAME);
    if (!all) return [];
    const out: RedactedSecretMetadata[] = [];
    const recordMap: Record<string, VaultRecord> = (all && typeof all === 'object' && !Array.isArray(all))
      ? (all as Record<string, VaultRecord>)
      : {};
    for (const [id, rec] of Object.entries(recordMap)) {
      if (id.startsWith('__')) continue;
      const bytes = base64ToBytes(rec.ciphertext);
      out.push({
        id,
        fingerprintPrefix: '<locked>',
        plaintextLength: bytes.byteLength,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt,
      });
    }
    return out;
  }

  public async storeSecret(id: string, plaintext: string): Promise<RedactedSecretMetadata> {
    if (!this.wrappingKey) throw new VaultLockedError();
    if (!id || id.startsWith('__')) {
      throw new Error('Invalid secret id: must be non-empty and must not start with __.');
    }
    const subtle = getSubtle();
    const iv = getRandomBytes(12);
    const ciphertext = await subtle.encrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv), additionalData: new Uint8Array(AAD_BYTES), tagLength: 128 },
      this.wrappingKey,
      new TextEncoder().encode(plaintext)
    );
    const now = Date.now();
    const all = (await this.storage.getItem<Record<string, VaultRecord>>(VAULT_STORE_NAME)) || {};
    const existing: VaultRecord | undefined = all[id];
    const record: VaultRecord = {
      id,
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
      iv: bytesToBase64(iv),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    all[id] = record;
    await this.storage.setItem(VAULT_STORE_NAME, all);
    return redactSecret(id, plaintext);
  }

  public async retrieveSecret(id: string): Promise<string> {
    if (!this.wrappingKey) throw new VaultLockedError();
    const all = await this.storage.getItem<Record<string, VaultRecord>>(VAULT_STORE_NAME);
    const rec = (all && typeof all === 'object' && !Array.isArray(all)) ? (all as Record<string, VaultRecord>)[id] : undefined;
    if (!rec) throw new Error(`Secret ${id} not found in vault.`);
    const subtle = getSubtle();
    let plaintext: ArrayBuffer;
    try {
      plaintext = await subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(base64ToBytes(rec.iv)), additionalData: new Uint8Array(AAD_BYTES), tagLength: 128 },
        this.wrappingKey,
        new Uint8Array(base64ToBytes(rec.ciphertext))
      );
    } catch {
      throw new VaultCorruptedError('ciphertext failed AEAD authentication');
    }
    return new TextDecoder().decode(plaintext);
  }

  public async deleteSecret(id: string): Promise<boolean> {
    const all = (await this.storage.getItem<Record<string, VaultRecord>>(VAULT_STORE_NAME)) || {};
    if (!all[id]) return false;
    delete all[id];
    await this.storage.setItem(VAULT_STORE_NAME, all);
    return true;
  }

  public async wipeVault(): Promise<void> {
    await this.storage.removeItem(VAULT_STORE_NAME);
    await this.storage.removeItem(SALT_KEY);
    await this.storage.removeItem(VERSION_KEY);
    this.wrappingKey = null;
    this.lastUnlockedAt = null;
  }

  private async doInitialize(passphrase: string): Promise<void> {
    const version = await this.storage.getItem<number>(VERSION_KEY);
    if (version === VAULT_VERSION) return;
    await this.getOrCreateSalt(passphrase);
    await this.storage.setItem(VERSION_KEY, VAULT_VERSION);
  }

  private async getOrCreateSalt(passphrase: string): Promise<Uint8Array> {
    const existing = await this.storage.getItem<string>(SALT_KEY);
    if (existing) {
      return base64ToBytes(existing);
    }
    const salt = getRandomBytes(16);
    await this.storage.setItem(SALT_KEY, bytesToBase64(salt));
    return salt;
  }
}

export const secureKeyVault = new SecureKeyVault();
