import { get, readonly, writable, type Writable } from "svelte/store";
import { createRootSurface, type RootSurface, type Surface } from "../logic/surfaces";
import { load, saveOnChange } from "../core/storage";
import { DbStores, getDb } from "../core/db";

const surfaceStores: Map<string, Writable<Surface>> = new Map();
export const rootSurfaces = writable<RootSurface>(createRootSurface());

export function addSurfaceToStores(id: string, surface: Surface) {
    const store = writable<Surface>(surface);
    surfaceStores.set(id, store);

    saveOnChange(store, DbStores.surfaces, id);
    surfacesInternal.update(surfaces => ({ ...surfaces, [id]: surface }));
    store.subscribe(s => {
        surfacesInternal.update(surfaces => ({ ...surfaces, [id]: s }));
    });

    return store;
}

export async function deleteSurfaceStore(id: string) {
    surfaceStores.delete(id);
    surfacesInternal.update(s => {
        const newState = structuredClone(s);
        delete newState[id];
        return newState;
    });

    const db = await getDb()
    await db.delete(DbStores.surfaces, id);
}

export function surfaceStore(id: string): Writable<Surface> {
    return surfaceStores.get(id)!;
}

export async function initSurfacesStores() {

    const db = await getDb()
    const surfaces = await db.getAll(DbStores.surfaces) as (Surface | RootSurface)[];

    for (const surface of surfaces.filter(s => s.type !== "Root")) {
        addSurfaceToStores(surface.id, surface);
        surfacesInternal.update(s => ({ ...s, [surface.id]: surface }));
    }

    rootSurfaces.set(await load(DbStores.mapping, "root-surfaces", createRootSurface()));
    saveOnChange(rootSurfaces, DbStores.mapping, "root-surfaces");
}

const surfacesInternal = writable<{ [id: string]: Surface }>({});
export const surfaces = readonly(surfacesInternal);

export function getAllSurfaces(): Surface[] {
    return Array.from(surfaceStores.values()).map(store => get(store));
}