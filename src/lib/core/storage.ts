import type { Writable } from "svelte/store";

export function load<T>(key: string, defaultValue: T): T {
    if (typeof localStorage === 'undefined') {
        return { ...defaultValue }
    }

    const stored = localStorage.getItem(key);
    if (!stored) {
        return { ...defaultValue }
    }

    const parsed = JSON.parse(stored) as Partial<T>
    return {
        ...defaultValue,
        ...parsed
    }
}

export function saveOnChange<T>(store: Writable<T>, key: string) {
    store.subscribe((val) => {
        if (typeof localStorage === "undefined") return;

        const json = JSON.stringify(val);
        localStorage.setItem(key, json);
    })
}