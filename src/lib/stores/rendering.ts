import { writable } from "svelte/store";
import { load, saveOnChange } from "../core/storage";
import type { Position } from "../logic/mapping";
import { DbStores } from "../core/db";
import type { MainCamera } from "../rendering/main-camera";
import type { MainScene } from "../rendering/main-scene";
import type { MainRenderer } from "../rendering/main-renderer";
import type { MainRaycaster } from "../rendering/main-raycaster";
import type { CompilationScene } from "../rendering/compilation-scene";

const STORE_RENDERING = DbStores.ui;

export type MainRendering = {
    position: Position
    zoom: number
}

const STORAGE_KEY_MAIN_RENDERING = 'tm-main-rendering'

const DEFAULT_MAIN_RENDERING: MainRendering = {
    position: [0, 0],
    zoom: 1
}

export const mainCamera = writable<MainCamera|null>(null);
export const mainScene = writable<MainScene|null>(null);
export const mainRenderer = writable<MainRenderer|null>(null);
export const mainRaycaster = writable<MainRaycaster|null>(null);
export const compilationScene = writable<CompilationScene|null>(null);

export const mainRendering = writable<MainRendering>(DEFAULT_MAIN_RENDERING)

export async function initRenderingStore() {
    mainRendering.set(await load(STORE_RENDERING, STORAGE_KEY_MAIN_RENDERING, DEFAULT_MAIN_RENDERING));
    saveOnChange(mainRendering, STORE_RENDERING, STORAGE_KEY_MAIN_RENDERING);
}
