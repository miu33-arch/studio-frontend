// public/tariff-engine/db.js

const DB_NAME = 'MIU_TRADE_ENGINE_IDB';
const DB_VERSION = 1;

class TradeDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Active Ingested BOM Ledger
        if (!db.objectStoreNames.contains('bom_ledger')) {
          const bomStore = db.createObjectStore('bom_ledger', { keyPath: 'id' });
          bomStore.createIndex('hsCode', 'hsCode', { unique: false });
        }

        // Corridor Tariff Registry (Offline Cache of All Rates)
        if (!db.objectStoreNames.contains('tariffs')) {
          db.createObjectStore('tariffs', { keyPath: 'corridor' });
        }

        // Engine State (Active regime, currency, tab)
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db);
      };

      req.onerror = () => reject(req.error);
    });
  }

  // --- META STATE (Regime, Currency, Active Tab) ---
  async setMeta(key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('meta', 'readwrite');
      tx.objectStore('meta').put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMeta(key, fallback = null) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('meta', 'readonly');
      const req = tx.objectStore('meta').get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : fallback);
      req.onerror = () => resolve(fallback);
    });
  }

  // --- TARIFF RATES CACHE (Offline Resilience) ---
  async saveCorridorRates(corridor, rates) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('tariffs', 'readwrite');
      tx.objectStore('tariffs').put({ corridor, rates });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCorridorRates(corridor) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('tariffs', 'readonly');
      const req = tx.objectStore('tariffs').get(corridor);
      req.onsuccess = () => resolve(req.result ? req.result.rates : null);
      req.onerror = () => resolve(null);
    });
  }

  // --- BOM LEDGER CRUD ---
  async saveAllBOM(items) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('bom_ledger', 'readwrite');
      const store = tx.objectStore('bom_ledger');
      store.clear();
      items.forEach(item => store.put(item));
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAllBOM() {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('bom_ledger', 'readonly');
      const req = tx.objectStore('bom_ledger').getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async clearBOM() {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('bom_ledger', 'readwrite');
      tx.objectStore('bom_ledger').clear();
      tx.oncomplete = () => resolve();
    });
  }
}

window.tradeDB = new TradeDB();