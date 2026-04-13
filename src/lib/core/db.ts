import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "tiny-mapper";
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase> | null = null;

export const DbStores = {
    ui: "UI",
    surfaces: "Surfaces",
    mapping: "Mapping",
    materials: "Materials",
    materialTemplates: "MaterialTemplates",
    settings: "Settings",
} as const;

export type DbStore = (typeof DbStores)[keyof typeof DbStores];

export async function getDb() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                for (const store of Object.values(DbStores)) {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store);
                    }
                }
            },
        });
    }
    return dbPromise;
}