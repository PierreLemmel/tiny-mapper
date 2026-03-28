import type { Writable } from "svelte/store";
import { dbGet, dbSet } from "./db";

export async function load<T>(key: string, defaultValue: T): Promise<T> {
    try {
        const stored = await dbGet<T>(key);

        if (stored) {            
            if (Array.isArray(stored)) {
                return stored;
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

export function saveOnChange<T>(store: Writable<T>, key: string) {
    store.subscribe((val) => {
        dbSet(key, val).catch(() => {});
    });
}
