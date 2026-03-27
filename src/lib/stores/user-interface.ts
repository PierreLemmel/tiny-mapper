import { writable } from "svelte/store"
import { load, saveOnChange } from "../core/storage"

const GLOBAL_UI_STORAGE_KEY = "tm-global-ui-content"
const MAPPING_UI_STORAGE_KEY = "tm-mapping-ui-content"
const SURFACE_STORAGE_KEY = "tm-surface-ui-content"
const RENDERING_UI_STORAGE_KEY = "tm-rendering-ui-content"

export type GlobalUIData = {
    activeTab: number
}

export type MappingUIData = {
    leftPanelOpen: boolean
    leftPanelSize: number

    rightPanelOpen: boolean
    rightPanelSize: number

    bottomPanelOpen: boolean
    leftEditorSize: number
}

export type SurfaceUIData = {
    selectedSurfaces: string[]
    collapsedGroups: string[]

    baseProperties : {
        open: boolean;
        colorOpen: boolean;
        colorColorMode: "hsv" | "rgb" | "hex";
    }

    transform: {
        open: boolean;
    }

    geometry: {
        open: boolean;
    }

    effects: {
        open: boolean
    }

    input: {
        open: boolean
    }

    material: {
        open: boolean
    }
}

export type RenderingUIData = {
    statsDisplay: boolean;
}

const DEFAULT_GLOBAL_UI_DATA: GlobalUIData = {
    activeTab: 0,
}

const DEFAULT_MAPPING_UI_DATA: MappingUIData = {
    leftPanelOpen: true,
    leftPanelSize: 300,
    rightPanelOpen: true,
    rightPanelSize: 300,
    bottomPanelOpen: true,
    leftEditorSize: 450,
}

const DEFAULT_SURFACE_UI_DATA: SurfaceUIData = {
    selectedSurfaces: [],
    collapsedGroups: [],

    baseProperties: {
        open: true,
        colorOpen: false,
        colorColorMode: "hsv",
    },
    transform: {
        open: false,
    },
    geometry: {
        open: false,
    },
    effects: {
        open: false,
    },
    input: {
        open: false,
    },
    material: {
        open: false,
    },
}

const DEFAULT_RENDERING_UI_DATA: RenderingUIData = {
    statsDisplay: false,
}

export const globalUI = writable<GlobalUIData>(
    load(GLOBAL_UI_STORAGE_KEY, DEFAULT_GLOBAL_UI_DATA)
)

export const mappingUI = writable<MappingUIData>(
    load(MAPPING_UI_STORAGE_KEY, DEFAULT_MAPPING_UI_DATA)
)

export const surfaceUI = writable<SurfaceUIData>(
    load(SURFACE_STORAGE_KEY, DEFAULT_SURFACE_UI_DATA)
)

export const renderingUI = writable<RenderingUIData>(
    load(RENDERING_UI_STORAGE_KEY, DEFAULT_RENDERING_UI_DATA)
)

export function saveUIOnChange() {
    saveOnChange(surfaceUI, SURFACE_STORAGE_KEY)
    saveOnChange(mappingUI, MAPPING_UI_STORAGE_KEY)
    saveOnChange(globalUI, GLOBAL_UI_STORAGE_KEY)
    saveOnChange(renderingUI, RENDERING_UI_STORAGE_KEY)
}