import { writable } from "svelte/store";
import { load, saveOnChange } from "../core/storage";
import type { Position } from "../logic/mapping";

export type MainRendering = {
    position: Position
    zoom: number
}

const STORAGE_KEY_MAIN_RENDERING = 'tm-main-rendering'

const DEFAULT_MAIN_RENDERING: MainRendering = {
    position: [0, 0],
    zoom: 1
}


export const mainRendering = writable<MainRendering>(load(STORAGE_KEY_MAIN_RENDERING, DEFAULT_MAIN_RENDERING))

export function saveMainRenderingOnChange() {
    saveOnChange(mainRendering, STORAGE_KEY_MAIN_RENDERING)
}