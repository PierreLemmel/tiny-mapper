import { get, readonly, writable, type Writable } from "svelte/store";
import {
    createDefaultMaterialTemplate,
    DEFAULT_MATERIAL_TEMPLATE_ID,
    type MaterialTemplate,
} from "../logic/material-templates/material-templates";
import { saveOnChange } from "../core/storage";
import { DbStores, getDb } from "../core/db";

const templateStores: Map<string, Writable<MaterialTemplate>> = new Map();

export function addMaterialTemplateToStores(id: string, template: MaterialTemplate) {
    const store = writable<MaterialTemplate>(template);
    templateStores.set(id, store);

    saveOnChange(store, DbStores.materialTemplates, id);
    templatesInternal.update(templates => ({ ...templates, [id]: template }));
    store.subscribe(t => {
        templatesInternal.update(templates => ({ ...templates, [id]: t }));
    });

    return store;
}

export async function deleteMaterialTemplateStore(id: string) {
    templateStores.delete(id);
    templatesInternal.update(t => {
        const newState = structuredClone(t);
        delete newState[id];
        return newState;
    });

    const db = await getDb();
    await db.delete(DbStores.materialTemplates, id);
}

export function materialTemplateStore(id: string): Writable<MaterialTemplate> {
    return templateStores.get(id)!;
}

export async function initMaterialTemplatesStores() {
    const db = await getDb();
    const templates = await db.getAll(DbStores.materialTemplates) as MaterialTemplate[];

    for (const template of templates) {
        addMaterialTemplateToStores(template.id, template);
    }

    if (!templateStores.has(DEFAULT_MATERIAL_TEMPLATE_ID)) {
        const defaultTemplate = createDefaultMaterialTemplate();
        addMaterialTemplateToStores(defaultTemplate.id, defaultTemplate);
    }
}

const templatesInternal = writable<{ [id: string]: MaterialTemplate }>({});
export const materialTemplates = readonly(templatesInternal);