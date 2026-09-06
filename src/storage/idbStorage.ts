/**
 * Quant Backtest Pro — Native IndexedDB Storage Adapter
 * 
 * Provides robust asynchronous client-side storage for large backtest sessions,
 * candle history, equity points, and drawings (>50MB capacity) without hitting
 * the browser's 5MB localStorage QuotaExceededError.
 */

const DB_NAME = 'QuantBacktestPro_DB';
const DB_VERSION = 1;
const STORE_NAME = 'session_cache';

class IDBStorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isAvailable: boolean = typeof window !== 'undefined' && 'indexedDB' in window;

  private getDB(): Promise<IDBDatabase> {
    if (!this.isAvailable) {
      return Promise.reject(new Error('IndexedDB is not supported in this environment.'));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        try {
          const req = window.indexedDB.open(DB_NAME, DB_VERSION);

          req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              db.createObjectStore(STORE_NAME);
            }
          };

          req.onsuccess = () => resolve(req.result);
          req.onerror = () => {
            this.dbPromise = null;
            reject(req.error || new Error('Failed to open IndexedDB.'));
          };
        } catch (err) {
          this.dbPromise = null;
          reject(err);
        }
      });
    }

    return this.dbPromise;
  }

  /**
   * Get an item by key from IndexedDB, falling back to localStorage
   */
  public async getItem<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise<T | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          if (req.result !== undefined && req.result !== null) {
            resolve(req.result as T);
          } else {
            // Fallback: check localStorage for legacy data
            resolve(this.getFromLocalStorage<T>(key));
          }
        };

        req.onerror = () => {
          resolve(this.getFromLocalStorage<T>(key));
        };
      });
    } catch {
      return this.getFromLocalStorage<T>(key);
    }
  }

  /**
   * Save an item by key in IndexedDB, with graceful fallback
   */
  public async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise<void>((resolve, _reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve();
        req.onerror = () => {
          this.saveToLocalStorage(key, value);
          resolve();
        };
      });
    } catch {
      this.saveToLocalStorage(key, value);
    }
  }

  /**
   * Remove an item from IndexedDB and localStorage
   */
  public async removeItem(key: string): Promise<void> {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      const db = await this.getDB();
      return new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  }

  private getFromLocalStorage<T>(key: string): T | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private saveToLocalStorage<T>(key: string, value: T): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[IDBStorage] localStorage fallback quota exceeded, skipping local mirror');
    }
  }
}

export const idbStorage = new IDBStorageAdapter();
