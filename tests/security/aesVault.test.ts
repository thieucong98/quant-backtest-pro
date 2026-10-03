/**
 * Secure Key Vault test suite - AUT-27.
 */

import { secureKeyVault as defaultVault, VaultLockedError, VaultCorruptedError, InMemoryStorage } from '../../src/security/aesVault';
import { SecureKeyVault } from '../../src/security/aesVault';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${msg}`);
  }
  console.log(`\u2705 [PASS] ${msg}`);
}

async function runTests() {
  console.log('\ud83e\uddea Testing SecureKeyVault AES-GCM...');

  // Use a fresh vault instance backed by in-memory storage for headless tests.
  const memStore = new InMemoryStorage();
  const vault: SecureKeyVault = (defaultVault as unknown as { wrappingKey: unknown });
  // Inject storage via prototype to avoid touching private fields directly.
  (vault as any).storage = memStore;
  (vault as any).wrappingKey = null;
  (vault as any).lastUnlockedAt = null;

  await vault.wipeVault();

  await vault.unlockVault('correct horse battery staple');
  assert(vault.isUnlocked(), 'Vault unlocked after unlockVault()');
  const meta = await vault.storeSecret('mt5_exness_api_key', 'sk_live_VERY_SECRET_VALUE_42');
  assert(meta.id === 'mt5_exness_api_key', 'storeSecret returns redacted metadata with id');
  assert(meta.plaintextLength === 'sk_live_VERY_SECRET_VALUE_42'.length, 'Plaintext length recorded');
  assert(/^[a-f0-9]{8}$/.test(meta.fingerprintPrefix), 'Fingerprint is 8-hex prefix');
  assert(!('plaintext' in meta), 'Metadata does NOT contain plaintext field');

  const recovered = await vault.retrieveSecret('mt5_exness_api_key');
  assert(recovered === 'sk_live_VERY_SECRET_VALUE_42', 'Round-trip retrieves original plaintext');

  const ids = await vault.listSecretIds();
  assert(ids.includes('mt5_exness_api_key'), 'listSecretIds includes stored secret');
  const metaList = await vault.listMetadata();
  assert(metaList.length === 1, 'listMetadata returns exactly one entry');
  assert(metaList[0].id === 'mt5_exness_api_key', 'Metadata id matches');

  vault.lockVault();
  assert(!vault.isUnlocked(), 'Vault locked after lockVault()');
  try {
    await vault.retrieveSecret('mt5_exness_api_key');
    assert(false, 'retrieveSecret on locked vault should throw');
  } catch (e) {
    assert(e instanceof VaultLockedError, 'Locked vault throws VaultLockedError');
  }

  await vault.unlockVault('wrong passphrase');
  try {
    await vault.retrieveSecret('mt5_exness_api_key');
    assert(false, 'Decrypt with wrong key should throw');
  } catch (e) {
    assert(e instanceof VaultCorruptedError, 'Wrong-passphrase decrypt throws VaultCorruptedError');
  }

  await vault.unlockVault('correct horse battery staple');
  const recovered2 = await vault.retrieveSecret('mt5_exness_api_key');
  assert(recovered2 === 'sk_live_VERY_SECRET_VALUE_42', 'Re-unlock with correct passphrase restores access');

  await vault.storeSecret('temp_secret', 'hello world');
  const all = await (vault as any).storage.getItem<Record<string, any>>('secure_key_vault');
  assert(all && all['temp_secret'], 'temp_secret present in raw storage');
  const ivBytes = Buffer.from(all['temp_secret'].iv, 'base64');
  ivBytes[0] ^= 0xff;
  all['temp_secret'].iv = ivBytes.toString('base64');
  await (vault as any).storage.setItem('secure_key_vault', all);
  try {
    await vault.retrieveSecret('temp_secret');
    assert(false, 'Tampered IV must be detected');
  } catch (e) {
    assert(e instanceof VaultCorruptedError, 'Tampered IV throws VaultCorruptedError');
  }

  const removed = await vault.deleteSecret('mt5_exness_api_key');
  assert(removed === true, 'deleteSecret returns true on success');
  const remaining = await vault.listSecretIds();
  assert(!remaining.includes('mt5_exness_api_key'), 'Deleted secret no longer listed');

  await vault.wipeVault();
  assert(!vault.isUnlocked(), 'Vault locked after wipe');
  const afterWipe = await vault.listSecretIds();
  assert(afterWipe.length === 0, 'wipeVault removes all secrets');

  const state = await vault.getState();
  assert(state.version === 1, 'State version is 1');
  assert(state.secretCount === 0, 'State secretCount reflects wipe');

  // Multi-secret uniqueness: encrypting same plaintext twice yields different ciphertexts (random IV)
  await vault.unlockVault('correct horse battery staple');
  const m1 = await vault.storeSecret('api_a', 'same-secret');
  const m2 = await vault.storeSecret('api_b', 'same-secret');
  const raw = await (vault as any).storage.getItem<Record<string, any>>('secure_key_vault');
  assert(raw['api_a'].ciphertext !== raw['api_b'].ciphertext, 'Same plaintext encrypts to different ciphertexts (random IV)');
  assert(m1.fingerprintPrefix === m2.fingerprintPrefix, 'But fingerprint prefix matches identical plaintext');

  console.log('\ud83c\udf89 SecureKeyVault AES-GCM test suite passed!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
