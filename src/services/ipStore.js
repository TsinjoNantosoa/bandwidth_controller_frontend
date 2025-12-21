/**
 * IndexedDB storage for IP tracking state
 * Provides persistent storage for large IP datasets with sequence versioning
 */

const DB_NAME = 'qos_ip_store';
const DB_VERSION = 1;
const STORE_NAME = 'ip_snapshots';

/**
 * Open or create the IndexedDB database
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('sequence', 'sequence', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Load the latest IP snapshot from IndexedDB
 * @returns {Promise<{ips: Array, sequence: number, timestamp: string}|null>}
 */
export async function loadStoredSnapshot() {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('latest');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            ips: result.ips || [],
            sequence: result.sequence || 0,
            timestamp: result.timestamp || new Date().toISOString(),
          });
        } else {
          resolve({ ips: [], sequence: 0, timestamp: new Date().toISOString() });
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to load stored snapshot:', error);
    return { ips: [], sequence: 0, timestamp: new Date().toISOString() };
  }
}

/**
 * Save IP snapshot to IndexedDB
 * @param {Array} ips - Array of IP objects
 * @param {number} sequence - State sequence number
 * @param {string} timestamp - ISO timestamp
 * @returns {Promise<void>}
 */
export async function saveStoredSnapshot(ips, sequence, timestamp) {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const data = {
        id: 'latest',
        ips: ips || [],
        sequence: sequence || 0,
        timestamp: timestamp || new Date().toISOString(),
        savedAt: new Date().toISOString(),
      };

      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to save snapshot:', error);
    throw error;
  }
}

/**
 * Clear all stored data (useful for reset/logout)
 * @returns {Promise<void>}
 */
export async function clearStoredSnapshot() {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear snapshot:', error);
    throw error;
  }
}

/**
 * Get metadata about stored snapshot (without loading full data)
 * @returns {Promise<{sequence: number, timestamp: string, count: number}|null>}
 */
export async function getSnapshotMetadata() {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('latest');

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            sequence: result.sequence || 0,
            timestamp: result.timestamp || null,
            count: (result.ips || []).length,
            savedAt: result.savedAt || null,
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get snapshot metadata:', error);
    return null;
  }
}
