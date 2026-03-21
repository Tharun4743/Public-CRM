import { openDB } from 'idb';

const DB_NAME = 'pscrm-offline';
const COMPLAINT_STORE = 'pending_complaints';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(COMPLAINT_STORE)) {
      db.createObjectStore(COMPLAINT_STORE, { keyPath: 'id', autoIncrement: true });
    }
  }
});

export const queueComplaint = async (payload: any) => {
  const db = await dbPromise;
  await db.add(COMPLAINT_STORE, { payload, createdAt: new Date().toISOString() });
};

export const flushComplaints = async (onSuccess?: (id: string) => void) => {
  const db = await dbPromise;
  const all = await db.getAll(COMPLAINT_STORE);
  for (const item of all) {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item.payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (onSuccess) onSuccess(data.id);
      await db.delete(COMPLAINT_STORE, item.id);
    }
  }
};
