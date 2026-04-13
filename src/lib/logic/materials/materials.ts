import { createId, isWithinArray } from "../../core/utils";
import { get } from "svelte/store";
import { addMaterialToStores, deleteMaterialStore, getAllMaterials, materialStore, rootMaterials } from "../../stores/materials";
import type { RawColor } from "../../core/color";
import { DEFAULT_MATERIAL_TEMPLATE_ID } from "../material-templates/material-templates";

export const DEFAULT_MATERIAL_ID = "default";

type MaterialBase = {
    id: string;
    parentId: string | "root";
    name: string;
    hidden?: boolean;
    tags?: string[];
}

export type MaterialType = "Group" | "SolidColor" | "Material" | "Root"

type MaterialData<T extends MaterialType, D> = { type: T } & MaterialBase & D

export type SolidColorMaterial = MaterialData<"SolidColor", {
    color: RawColor
}>

export type GroupMaterial = MaterialData<"Group", {
    children: string[]
}>

export type MaterialMaterial = MaterialData<"Material", {
    templateId: string;
}>

export type RootMaterial = {
    type: "Root";
    id: "root";
    children: string[]
}

export type Material = SolidColorMaterial | GroupMaterial | MaterialMaterial

const MAX_ITERATIONS = 1000

function nextAvailableName(type: MaterialType) {
    let i = 1;

    const lowerType = type.toLowerCase();

    const existingNames = getAllMaterials()
        .map(m => m.name.toLowerCase())
        .filter(n => n.startsWith(lowerType));

    let name: string = "UNINITIALIZED";
    let found = false;
    while (i < MAX_ITERATIONS && !found) {
        name = `${type}-${i.toString().padStart(2, "0")}`;
        const lowerName = name.toLowerCase();

        found = existingNames.every(n => n !== lowerName);

        i++;
    }

    if (!found) {
        throw new Error(`Impossible to find an available name for material "${type}"`);
    }

    return name;
}

function createMaterialBase(): Omit<MaterialBase, "name"> {
    return {
        id: createId(),
        parentId: "root",
    }
}

export function addMaterial(material: Material, positionInChildren: number = -1) {
    switch (material.type) {
        case "SolidColor":
            return createSolidColorMaterial(material, positionInChildren);
        case "Group":
            return createGroupMaterial(material, positionInChildren);
        case "Material":
            return createMaterialMaterial(material, positionInChildren);
    }
}

function bindMaterialToParent(material: Material, positionInChildren: number = -1) {
    if (material.parentId === "root") {
        rootMaterials.update(r => {
            if (isWithinArray(r.children, positionInChildren) && r.children[positionInChildren] === material.id) {
                return r;
            }
            return {
            ...r,
                children: positionInChildren === -1 ?
                    [...r.children, material.id] :
                    [...r.children.slice(0, positionInChildren), material.id, ...r.children.slice(positionInChildren)]
            }
        });
    }
    else {
        materialStore(material.parentId)
            .update(m => {
                if (m.type !== "Group") {
                    return m;
                }

                if (isWithinArray(m.children, positionInChildren) && m.children[positionInChildren] === material.id) {
                    return m;
                }

                return {
                    ...m,
                    children: positionInChildren === -1 ?
                        [...m.children, material.id] :
                        [...m.children.slice(0, positionInChildren), material.id, ...m.children.slice(positionInChildren)]
                };
            });
    }
}

export function createSolidColorMaterial(values: Partial<Omit<SolidColorMaterial, "type">> = {}, positionInChildren: number = -1) {
    const name = nextAvailableName("SolidColor");

    const material: SolidColorMaterial = {
        name,
        type: "SolidColor",
        color: [1, 1, 1, 1],
        ...createMaterialBase(),
        ...values
    };

    addMaterialToStores(material.id, material);
    bindMaterialToParent(material, positionInChildren);

    return material;
}

export function createGroupMaterial(values: Partial<Omit<GroupMaterial, "type">> = {}, positionInChildren: number = -1) {
    const name = nextAvailableName("Group");

    const material: GroupMaterial = {
        name,
        type: "Group",
        ...createMaterialBase(),
        children: [],
        ...values
    };

    addMaterialToStores(material.id, material);
    bindMaterialToParent(material, positionInChildren);

    return material;
}

export function createMaterialMaterialFromTemplate(
    templateId: string,
    values: Partial<Omit<MaterialMaterial, "type" | "templateId">> = {},
    positionInChildren: number = -1
) {
    const name = nextAvailableName("Material");

    const material: MaterialMaterial = {
        name,
        type: "Material",
        templateId,
        ...createMaterialBase(),
        ...values
    };

    addMaterialToStores(material.id, material);
    bindMaterialToParent(material, positionInChildren);

    return material;
}

export function createMaterialMaterial(values: Partial<Omit<MaterialMaterial, "type">> = {}, positionInChildren: number = -1) {
    const { templateId = DEFAULT_MATERIAL_TEMPLATE_ID, ...rest } = values;
    return createMaterialMaterialFromTemplate(templateId, rest, positionInChildren);
}

export function createDefaultHiddenMaterialMaterial(): MaterialMaterial {
    return {
        id: DEFAULT_MATERIAL_ID,
        name: "Default",
        type: "Material",
        templateId: DEFAULT_MATERIAL_TEMPLATE_ID,
        parentId: "root",
        hidden: true,
    };
}

export function createRootMaterial(): RootMaterial {
    return {
        type: "Root",
        id: "root",
        children: []
    };
}

export function getMaterialInsertionPoint(selectedIds: string[]): { parentId: string; positionInChildren: number } {
    if (selectedIds.length === 0) {
        return { parentId: "root", positionInChildren: -1 };
    }

    const lastId = selectedIds[selectedIds.length - 1];
    const lastMaterial = get(materialStore(lastId));

    if (!lastMaterial) {
        return { parentId: "root", positionInChildren: -1 };
    }

    if (lastMaterial.type === "Group") {
        return { parentId: lastId, positionInChildren: -1 };
    }

    const parentId = lastMaterial.parentId;

    if (parentId === "root") {
        const root = get(rootMaterials);
        const idx = root.children.indexOf(lastId);
        return { parentId, positionInChildren: idx >= 0 ? idx + 1 : -1 };
    }

    const parentStore = materialStore(parentId);
    const parent = parentStore ? get(parentStore) : null;
    if (parent && parent.type === "Group") {
        const idx = parent.children.indexOf(lastId);
        return { parentId, positionInChildren: idx >= 0 ? idx + 1 : -1 };
    }

    return { parentId: "root", positionInChildren: -1 };
}

function collectDescendants(id: string, result: { id: string, positionInChildren: number }[]) {
    const store = materialStore(id);
    const material = get(store);

    if (material.type === "Group") {
        for (const childId of material.children) {
            collectDescendants(childId, result);
        }
    }

    const siblings = material.parentId === "root" ? get(rootMaterials).children : (get(materialStore(material.parentId)) as GroupMaterial).children
    const positionInChildren = siblings.indexOf(id);
    
    result.push({ id, positionInChildren });
}

export function deleteMaterialAndChildren(id: string): { material: Material, positionInChildren: number }[] {

    const store = materialStore(id);
    const material = get(store);

    const itemsToDelete: { id: string, positionInChildren: number }[] = [];
    collectDescendants(id, itemsToDelete);

    if (material.parentId !== "root") {
        const parent = materialStore(material.parentId);
        parent.update(m => {
            if (m.type === "Group") {
                return {
                    ...m,
                    children: m.children.filter(cid => cid !== id)
                };
            }
            return m;
        });
    }
    else {
        rootMaterials.update(r => ({
            ...r,
            children: r.children.filter(cid => cid !== id)
        }));
    }

    const deletedMaterials = itemsToDelete.map(({ id, positionInChildren }) => ({
        material: structuredClone(get(materialStore(id))),
        positionInChildren
    }));
    itemsToDelete.forEach(({ id }) => deleteMaterialStore(id));

    return deletedMaterials;
}
