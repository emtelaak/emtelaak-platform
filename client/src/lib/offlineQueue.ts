/**
 * Offline Transaction Queue using IndexedDB
 * 
 * Enables users to initiate investments while offline.
 * Transactions are queued and automatically submitted when connection returns.
 */

const DB_NAME = 'EmtelaakOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'pendingTransactions';

export interface PendingTransaction {
  id?: number;
  type: 'investment' | 'withdrawal' | 'transfer';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create indexes
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Add a transaction to the offline queue
 */
export async function queueTransaction(
  type: PendingTransaction['type'],
  data: any
): Promise<number> {
  const db = await openDB();

  const transaction: Omit<PendingTransaction, 'id'> = {
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(transaction);

    request.onsuccess = () => {
      console.log('[Offline Queue] Transaction queued:', request.result);
      resolve(request.result as number);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all pending transactions
 */
export async function getPendingTransactions(): Promise<PendingTransaction[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('status');
    const request = index.getAll('pending');

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all transactions (for debugging/admin)
 */
export async function getAllTransactions(): Promise<PendingTransaction[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  id: number,
  status: PendingTransaction['status'],
  error?: string
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const transaction = getRequest.result;
      if (!transaction) {
        reject(new Error('Transaction not found'));
        return;
      }

      transaction.status = status;
      if (error) {
        transaction.error = error;
      }
      if (status === 'syncing') {
        transaction.retryCount += 1;
      }

      const updateRequest = store.put(transaction);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete a transaction from the queue
 */
export async function deleteTransaction(id: number): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('[Offline Queue] Transaction deleted:', id);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all transactions (use with caution)
 */
export async function clearAllTransactions(): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[Offline Queue] All transactions cleared');
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if online and trigger sync
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Register background sync (if supported)
 */
export async function registerBackgroundSync(tag: string = 'sync-transactions'): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log('[Offline Queue] Background sync registered:', tag);
    } catch (error) {
      console.error('[Offline Queue] Background sync registration failed:', error);
    }
  } else {
    console.warn('[Offline Queue] Background sync not supported');
  }
}

/**
 * Get pending transaction count
 */
export async function getPendingCount(): Promise<number> {
  const transactions = await getPendingTransactions();
  return transactions.length;
}
