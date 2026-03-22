import { writable } from "svelte/store"
import { load, saveOnChange } from "../core/storage"

const GLOBAL_UI_STORAGE_KEY = "tm-global-ui-content"
const SURFACE_STORAGE_KEY = "tm-surface-ui-content"

export type GlobalUIData = {
    activeTab: number
}

export type SurfaceUIData = {
    leftPanelSize: number
    rightPanelSize: number
    leftEditorSize: number
    selectedSurfaces: string[]
}

const DEFAULT_GLOBAL_UI_DATA: GlobalUIData = {
    activeTab: 0,
}

const DEFAULT_SURFACE_UI_DATA: SurfaceUIData = {
    selectedSurfaces: [],
    leftPanelSize: 260,
    rightPanelSize: 260,
    leftEditorSize: 450,
}

export const globalUI = writable<GlobalUIData>(
    load(GLOBAL_UI_STORAGE_KEY, DEFAULT_GLOBAL_UI_DATA)
)

export const surfaceUI = writable<SurfaceUIData>(
    load(SURFACE_STORAGE_KEY, DEFAULT_SURFACE_UI_DATA)
)

export function saveUIOnChange() {
    saveOnChange(surfaceUI, SURFACE_STORAGE_KEY)
    saveOnChange(globalUI, GLOBAL_UI_STORAGE_KEY)
}