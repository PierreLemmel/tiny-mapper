import { writable } from "svelte/store";
import type { Surface } from "../logic/surfaces";
import { load, saveOnChange } from "../core/storage";

const STORAGE_KEY_SURFACES = 'tm-surfaces'
const STORAGE_KEY_ROOT_SURFACES = 'tm-root-surfaces'

export type SurfacesMap = {
    [key: string]: Surface
}

export const surfaces = writable<SurfacesMap>({})
export const rootSurfaces = writable<string[]>([])

export async function initContentStores() {
    surfaces.set(await load(STORAGE_KEY_SURFACES, {}));
    rootSurfaces.set(await load(STORAGE_KEY_ROOT_SURFACES, []));

    saveOnChange(surfaces, STORAGE_KEY_SURFACES);
    saveOnChange(rootSurfaces, STORAGE_KEY_ROOT_SURFACES);
}