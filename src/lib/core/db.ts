import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "tiny-mapper";
const DB_VERSION = 1;
const STORE_NAME = "app-state";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            },
        });
    }
    return dbPromise;
}

export async function dbGet<T>(key: string): Promise<T | undefined> {
    const db = await getDb();
    return db.get(STORE_NAME, key);
}

export async function dbSet<T>(key: string, value: T): Promise<void> {
    const db = await getDb();
    await db.put(STORE_NAME, value, key);
}
