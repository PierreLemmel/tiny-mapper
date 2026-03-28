import type { Writable } from "svelte/store";
import { getDb, type DbStore } from "./db";

export async function load<T>(dbStore: DbStore, key: string, defaultValue: T): Promise<T> {
    try {
        const db = await getDb();
        const stored = await db.get(dbStore, key);

        if (stored) {            
            if (Array.isArray(stored)) {
                return stored as T;
            }

            return {
                ...structuredClone(defaultValue),
                ...stored,
            }
        }

        return structuredClone(defaultValue);
    } catch {
        return structuredClone(defaultValue);
    }
}

export function saveOnChange<T>(store: Writable<T>, dbStore: DbStore, key: string) {
    store.subscribe(async (val) => {
        const db = await getDb();
        try {
            await db.put(dbStore, val, key);
        } catch (err){
            console.error("Failed to save to database", err);
        }
    });
}