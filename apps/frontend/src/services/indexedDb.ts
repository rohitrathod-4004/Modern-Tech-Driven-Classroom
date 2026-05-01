export interface PersistentChunk {
  id: string;
  session_id: string;
  chunk_index: number;
  blob: Blob;
  language: string;
}

const DB_NAME = "transcriber-db";
const STORE_NAME = "chunks";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveChunkOffline(chunk: PersistentChunk): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(chunk);
    
    request.onsuccess = () => {
      console.log(`[IndexedDB] saved to IndexedDB: chunk_${chunk.chunk_index}`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllOfflineChunks(): Promise<PersistentChunk[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      console.log(`[IndexedDB] loaded from IndexedDB — length ${request.result?.length || 0}`);
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removeChunkOffline(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
