/* js/db.js */

const DB_NAME = 'WoundAnalyzerDB';
const DB_VERSION = 1;

class WoundDatabase {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  /**
   * Initialize the IndexedDB database.
   */
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Sessions store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
          sessionStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Entries store (photos per session)
        if (!db.objectStoreNames.contains('entries')) {
          const entryStore = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
          entryStore.createIndex('sessionId', 'sessionId', { unique: false });
          entryStore.createIndex('takenAt', 'takenAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB open error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Ensure database is initialized before execution.
   */
  async ensureDb() {
    if (!this.db) {
      await this.initPromise;
    }
    return this.db;
  }

  /* --- SESSIONS (Sesi Luka) --- */

  /**
   * Get all wound sessions.
   * Sorted by createdAt descending.
   */
  async getAllSessions() {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readonly');
      const store = transaction.objectStore('sessions');
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev'); // prev means newest first

      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single session by ID.
   */
  async getSessionById(id) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.get(Number(id));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Create a new wound session.
   * @param {Object} session 
   */
  async createSession(session) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      
      const newSession = {
        name: session.name,
        bodyLocation: session.bodyLocation,
        startDate: session.startDate || new Date().toISOString().split('T')[0],
        notes: session.notes || '',
        isActive: true,
        createdAt: Date.now()
      };

      const request = store.add(newSession);
      request.onsuccess = () => resolve(request.result); // Returns the generated ID
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a session.
   */
  async updateSession(session) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sessions', 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.put(session);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a session and all its associated entries.
   */
  async deleteSession(sessionId) {
    const db = await this.ensureDb();
    
    // First, delete entries
    const entries = await this.getEntriesBySession(sessionId);
    const entryIds = entries.map(e => e.id);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sessions', 'entries'], 'readwrite');
      
      // Delete entries
      const entryStore = transaction.objectStore('entries');
      entryIds.forEach(id => entryStore.delete(id));
      
      // Delete session
      const sessionStore = transaction.objectStore('sessions');
      const request = sessionStore.delete(Number(sessionId));

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }


  /* --- ENTRIES (Foto Pemantauan Luka) --- */

  /**
   * Get all entries for a specific session.
   * Sorted by takenAt ascending (oldest first, for timeline and charts).
   */
  async getEntriesBySession(sessionId) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const index = store.index('sessionId');
      const request = index.openCursor(IDBKeyRange.only(Number(sessionId)));

      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          // Sort ascending by takenAt
          results.sort((a, b) => a.takenAt - b.takenAt);
          resolve(results);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add a tracking entry for a session.
   * @param {Object} entry 
   */
  async addEntry(entry) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('entries', 'readwrite');
      const store = transaction.objectStore('entries');

      const newEntry = {
        sessionId: Number(entry.sessionId),
        photoBlob: entry.photoBlob, // Blob compressed
        source: entry.source || 'gallery', // 'camera' | 'gallery'
        maskData: entry.maskData || { path: '' },
        areaPercent: Number(entry.areaPercent),
        areaCm2: Number(entry.areaCm2),
        areaChange: Number(entry.areaChange || 0),
        trend: entry.trend || 'stable', // 'improving' | 'stable' | 'worsening'
        confidence: Number(entry.confidence || 90),
        notes: entry.notes || '',
        takenAt: entry.takenAt || Date.now(),
        necroticPercent: Number(entry.necroticPercent || 0),
        sloughPercent: Number(entry.sloughPercent || 0),
        granulationPercent: Number(entry.granulationPercent || 0),
        isBlurry: entry.isBlurry ? 1 : 0,
        blurScore: Number(entry.blurScore || 0)
      };

      const request = store.add(newEntry);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single entry by ID.
   */
  async getEntryById(id) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('entries', 'readonly');
      const store = transaction.objectStore('entries');
      const request = store.get(Number(id));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an entry.
   */
  async deleteEntry(entryId) {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('entries', 'readwrite');
      const store = transaction.objectStore('entries');
      const request = store.delete(Number(entryId));

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Nuke all data in the database (for testing and settings nuke).
   */
  async nukeDatabase() {
    const db = await this.ensureDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['sessions', 'entries'], 'readwrite');
      const sessionStore = transaction.objectStore('sessions');
      const entryStore = transaction.objectStore('entries');
      
      sessionStore.clear();
      entryStore.clear();

      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Calculate storage space used by IndexedDB in MB (approx).
   */
  async getStorageUsage() {
    const db = await this.ensureDb();
    return new Promise(async (resolve) => {
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          const usageMB = (estimate.usage / (1024 * 1024)).toFixed(2);
          resolve(Number(usageMB));
        } catch {
          resolve(0.1); // Fallback
        }
      } else {
        // Direct count calculation
        let sizeBytes = 0;
        const transaction = db.transaction('entries', 'readonly');
        const store = transaction.objectStore('entries');
        const request = store.openCursor();
        
        request.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            if (cursor.value.photoBlob) {
              sizeBytes += cursor.value.photoBlob.size;
            }
            cursor.continue();
          } else {
            resolve(Number((sizeBytes / (1024 * 1024)).toFixed(2)));
          }
        };
        request.onerror = () => resolve(0);
      }
    });
  }
}

// Instantiate and attach globally
window.WoundDb = new WoundDatabase();
