import { get, readonly, writable, type Writable } from "svelte/store";
import { createRootMaterial, type RootMaterial, type Material } from "../logic/materials";
import { load, saveOnChange } from "../core/storage";
import { DbStores, getDb } from "../core/db";

const materialStores: Map<string, Writable<Material>> = new Map();
export const rootMaterials = writable<RootMaterial>(createRootMaterial());

export function addMaterialToStores(id: string, material: Material) {
    const store = writable<Material>(material);
    materialStores.set(id, store);

    saveOnChange(store, DbStores.materials, id);
    materialsInternal.update(materials => ({ ...materials, [id]: material }));
    store.subscribe(m => {
        materialsInternal.update(materials => ({ ...materials, [id]: m }));
    });

    return store;
}

export async function deleteMaterialStore(id: string) {
    materialStores.delete(id);
    materialsInternal.update(m => {
        const newState = structuredClone(m);
        delete newState[id];
        return newState;
    });

    const db = await getDb();
    await db.delete(DbStores.materials, id);
}

export function materialStore(id: string): Writable<Material> {
    return materialStores.get(id)!;
}

export async function initMaterialsStores() {
    const db = await getDb();
    const materials = await db.getAll(DbStores.materials) as (Material | RootMaterial)[];

    for (const material of materials.filter(m => m.type !== "Root")) {
        addMaterialToStores(material.id, material as Material);
        materialsInternal.update(m => ({ ...m, [material.id]: material as Material }));
    }

    rootMaterials.set(await load(DbStores.materials, "root-materials", createRootMaterial()));
    saveOnChange(rootMaterials, DbStores.materials, "root-materials");
}

const materialsInternal = writable<{ [id: string]: Material }>({});
export const materials = readonly(materialsInternal);

export function getAllMaterials(): Material[] {
    return Array.from(materialStores.values()).map(store => get(store));
}
