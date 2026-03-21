import { writable } from "svelte/store";
import type { Surface } from "../logic/surfaces";
import { load, saveOnChange } from "../core/storage";

export type Content = {
    surfaces: { [key: string]: Surface }
    rootSurfaces: string[]
}

const STORAGE_KEY = 'SBM-CONTENT'

const DEFAULT_CONTENT: Content = {
    surfaces: {},
    rootSurfaces: []
}


export const content = writable<Content>(load(STORAGE_KEY, DEFAULT_CONTENT))

export function saveContentOnChange() {
    saveOnChange(content, STORAGE_KEY)
}