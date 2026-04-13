import { writable } from "svelte/store"
import { load, saveOnChange } from "../core/storage"
import { DbStores } from "../core/db";

const STORE_UI = DbStores.ui;

const GLOBAL_UI_STORAGE_KEY = "tm-global-ui-content"
const MAPPING_UI_STORAGE_KEY = "tm-mapping-ui-content"
const SURFACE_STORAGE_KEY = "tm-surface-ui-content"
const RENDERING_UI_STORAGE_KEY = "tm-rendering-ui-content"
const MATERIAL_STORAGE_KEY = "tm-material-ui-content"

export type GlobalUIData = {
    activeTab: number
}

export type MappingUIData = {
    leftPanelOpen: boolean
    leftPanelSize: number

    rightPanelOpen: boolean
    rightPanelSize: number

    bottomPanelOpen: boolean
    bottomPanelSize: number

    leftEditorSize: number
    rightEditorSize: number
}

export type SurfaceUIData = {
    selectedSurfaces: string[];
    selectedHandles: {
        [surfaceId: string]: number[];
    };
    collapsedGroups: string[]

    baseProperties : {
        open: boolean;
        colorOpen: boolean;
        colorColorMode: "hsv" | "rgb" | "hex";
        materialOpen: boolean;
    }

    transform: {
        open: boolean;
        lockScale: boolean;
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
        open: boolean;
    }
}

export type RenderingUIData = {
    statsDisplay: boolean;
}

export type MaterialUIData = {
    selectedMaterials: string[]
    collapsedGroups: string[]
    tagFilter: string | null
    searchQuery: string

    baseProperties: {
        open: boolean;
        colorOpen: boolean;
        colorColorMode: "hsv" | "rgb" | "hex";
    }
}

const DEFAULT_GLOBAL_UI_DATA: GlobalUIData = {
    activeTab: 0,
}

const DEFAULT_MAPPING_UI_DATA: MappingUIData = {
    leftPanelOpen: true,
    leftPanelSize: 300,
    rightPanelOpen: true,
    rightPanelSize: 300,
    bottomPanelOpen: false,
    bottomPanelSize: 250,
    leftEditorSize: 450,
    rightEditorSize: 450,
}

const DEFAULT_SURFACE_UI_DATA: SurfaceUIData = {
    selectedSurfaces: [],
    selectedHandles: {},
    collapsedGroups: [],

    baseProperties: {
        open: true,
        colorOpen: false,
        colorColorMode: "hsv",
        materialOpen: false,
    },
    transform: {
        open: false,
        lockScale: true,
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

const DEFAULT_MATERIAL_UI_DATA: MaterialUIData = {
    selectedMaterials: [],
    collapsedGroups: [],
    tagFilter: null,
    searchQuery: "",

    baseProperties: {
        open: true,
        colorOpen: false,
        colorColorMode: "hsv",
    },
}

export const globalUI = writable<GlobalUIData>(DEFAULT_GLOBAL_UI_DATA)
export const mappingUI = writable<MappingUIData>(DEFAULT_MAPPING_UI_DATA)
export const surfaceUI = writable<SurfaceUIData>(DEFAULT_SURFACE_UI_DATA)
export const renderingUI = writable<RenderingUIData>(DEFAULT_RENDERING_UI_DATA)
export const materialUI = writable<MaterialUIData>(DEFAULT_MATERIAL_UI_DATA)

export async function initUIStores() {
    globalUI.set(await load(STORE_UI, GLOBAL_UI_STORAGE_KEY, DEFAULT_GLOBAL_UI_DATA));
    mappingUI.set(await load(STORE_UI, MAPPING_UI_STORAGE_KEY, DEFAULT_MAPPING_UI_DATA));
    surfaceUI.set(await load(STORE_UI, SURFACE_STORAGE_KEY, DEFAULT_SURFACE_UI_DATA));
    renderingUI.set(await load(STORE_UI, RENDERING_UI_STORAGE_KEY, DEFAULT_RENDERING_UI_DATA));
    materialUI.set(await load(STORE_UI, MATERIAL_STORAGE_KEY, DEFAULT_MATERIAL_UI_DATA));

    saveOnChange(globalUI, STORE_UI, GLOBAL_UI_STORAGE_KEY);
    saveOnChange(mappingUI, STORE_UI, MAPPING_UI_STORAGE_KEY);
    saveOnChange(surfaceUI, STORE_UI, SURFACE_STORAGE_KEY);
    saveOnChange(renderingUI, STORE_UI, RENDERING_UI_STORAGE_KEY);
    saveOnChange(materialUI, STORE_UI, MATERIAL_STORAGE_KEY);
}
