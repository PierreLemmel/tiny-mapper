import { writable } from "svelte/store"
import { load, saveOnChange } from "../core/storage"

const SURFACE_STORAGE_KEY = "SURFACE-UI-CONTENT"

export type SurfaceUIData = {
    selectedSurfaces: string[]
}

const DEFAULT_SURFACE_UI_DATA: SurfaceUIData = {
    selectedSurfaces: []
}

export const surfaceUI = writable<SurfaceUIData>(
    load(SURFACE_STORAGE_KEY, DEFAULT_SURFACE_UI_DATA)
)

export function saveUIOnChange() {
    saveOnChange(surfaceUI, SURFACE_STORAGE_KEY)
}