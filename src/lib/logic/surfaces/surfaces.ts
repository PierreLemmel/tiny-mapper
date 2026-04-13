import {
    addSurfaceToStores,
    deleteSurfaceStore,
    getAllSurfaces,
    rootSurfaces,
    surfaceStore,
} from "../../stores/surfaces";
import type { BlendMode, Position, Scale, SurfaceFlip, UV } from "../mapping";
import type { RawColor } from "../../core/color";
import { createId, isWithinArray } from "../../core/utils";
import { get } from "svelte/store";
import { DEFAULT_MATERIAL_ID } from "../materials/materials";

const DEFAULT_SCALE: Scale = [1, 1]


export type SurfaceTransform = {
    position: Position;
    scale: Scale;
    rotation: number;
}


export type SurfaceGeometry = {
    vertices: Position[],
    uvs: UV[],
    indices: number[]
}

export type QuadGeometry = SurfaceGeometry

export type SurfaceBase = {
    id: "root"|string;
    parentId: string | "root";
    enabled: boolean;
    name: string;
    opacity: number;
    color: RawColor;
    flip: SurfaceFlip;
    blendMode: BlendMode;
    feathering: number;
    transform: SurfaceTransform;
}

export type SurfaceType = "Group"|"Quad"|"Root"

type SurfaceData<T extends SurfaceType, D> = { type: T } & SurfaceBase & D

export type QuadSurface = SurfaceData<"Quad", {
    geometry: QuadGeometry;
    materialId: string;
}>

export type GroupSurface = SurfaceData<"Group", {
    children: string[]
}>

export type RootSurface = {
    type: "Root";
    id: "root";
    children: string[]
}

export type Surface = QuadSurface | GroupSurface

const MAX_ITERATIONS = 1000

function nextAvailableName(type: SurfaceType) {
    let i = 1;

    const lowerType = type.toLowerCase()

    const existingNames = getAllSurfaces()
        .map(s => s.name.toLowerCase())
        .filter(n => n.startsWith(lowerType));

    let name: string = "UNITIALIZED";
    let found = false;
    while(i < MAX_ITERATIONS && !found) {
        name = `${type}-${i.toString().padStart(2, "0")}`
        const lowerName = name.toLowerCase()

        found = existingNames.every(n => n !== lowerName)

        i++;
    }

    if (!found) {
        throw new Error(`Impossible to find an available name for group "${type}"`)
    }

    return name;
}

function createSurfaceBase(): Omit<SurfaceBase, "name"> {
    return {
        id: createId(),
        parentId: "root",
        enabled: true,
        opacity: 1,
        color: [1, 1, 1, 1],
        flip: [false, false],
        blendMode: "Over",
        feathering: 0,
        transform: createDefaultSurfaceTransform()
    }
}

function createDefaultSurfaceTransform(): SurfaceTransform {
    return {
        position: [0, 0],
        scale: [...DEFAULT_SCALE],
        rotation: 0
    }
}

const DEFAULT_QUAD_WIDTH: number = 150;
const DEFAULT_QUAD_HEIGHT: number = 100;

function createDefaultQuadGeometry(): QuadGeometry {
    return {
        vertices: [
            [-DEFAULT_QUAD_WIDTH / 2, -DEFAULT_QUAD_HEIGHT / 2],
            [DEFAULT_QUAD_WIDTH / 2, -DEFAULT_QUAD_HEIGHT / 2],
            [DEFAULT_QUAD_WIDTH / 2, DEFAULT_QUAD_HEIGHT / 2],
            [-DEFAULT_QUAD_WIDTH / 2, DEFAULT_QUAD_HEIGHT / 2]
        ],
        uvs: [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1]
        ],
        indices: [
            0, 1, 2,
            0, 2, 3
        ]
    }
}

export function addSurface(surface: Surface, positionInChildren: number = -1, bindToParent: boolean = true) {
    switch (surface.type) {
        case "Quad":
            return createQuadSurface(surface, positionInChildren);
        case "Group":
            return createGroupSurface(surface, positionInChildren);
    }
}

function bindSurfaceToParent(surface: Surface, positionInChildren: number = -1) {
    if (surface.parentId === "root") {
        rootSurfaces.update(r => {
            if (isWithinArray(r.children, positionInChildren) && r.children[positionInChildren] === surface.id) {
                return r;
            }
            return {
                ...r,
                children: positionInChildren === -1 ?
                    [...r.children, surface.id] :
                    [...r.children.slice(0, positionInChildren), surface.id, ...r.children.slice(positionInChildren)]
            }
        });
    }
    else {
        surfaceStore(surface.parentId)
            .update(s => {
                if (s.type !== "Group") {
                    return s
                }

                if (isWithinArray(s.children, positionInChildren) && s.children[positionInChildren] === surface.id) {
                    return s;
                }

                return {
                    ...s,
                    children: positionInChildren === -1 ?
                        [...s.children, surface.id] :
                        [...s.children.slice(0, positionInChildren), surface.id, ...s.children.slice(positionInChildren)]
                }
            });
    }
}

export function createQuadSurface(values: Partial<Omit<QuadSurface, "type">> = {}, positionInChildren: number = -1) {
    const name = nextAvailableName("Quad")

    const surface: QuadSurface = {
        name,
        type: "Quad",
        ...createSurfaceBase(),
        geometry: createDefaultQuadGeometry(),
        materialId: DEFAULT_MATERIAL_ID,
        ...values
    }

    addSurfaceToStores(surface.id, surface);
    bindSurfaceToParent(surface, positionInChildren);

    return surface;
}


export function createGroupSurface(values: Partial<Omit<GroupSurface, "type">> = {}, positionInChildren: number = -1) {
    const name = nextAvailableName("Group")
    
    const surface: GroupSurface = {
        name,
        type: "Group",
        ...createSurfaceBase(),
        children: [],
        ...values
    }
    
    addSurfaceToStores(surface.id, surface)
    bindSurfaceToParent(surface, positionInChildren);

    return surface;
}

export function createRootSurface(): RootSurface {
    return {
        type: "Root",
        id: "root",
        children: []
    }
}

export function getSurfaceInsertionPoint(selectedIds: string[]): { parentId: string; positionInChildren: number } {
    if (selectedIds.length === 0) {
        return { parentId: "root", positionInChildren: -1 };
    }

    const lastId = selectedIds[selectedIds.length - 1];
    const lastSurface = get(surfaceStore(lastId));

    if (!lastSurface) {
        return { parentId: "root", positionInChildren: -1 };
    }

    if (lastSurface.type === "Group") {
        return { parentId: lastId, positionInChildren: -1 };
    }

    const parentId = lastSurface.parentId;

    if (parentId === "root") {
        const root = get(rootSurfaces);
        const idx = root.children.indexOf(lastId);
        return { parentId, positionInChildren: idx >= 0 ? idx + 1 : -1 };
    }

    const parent = get(surfaceStore(parentId));
    if (parent && parent.type === "Group") {
        const idx = parent.children.indexOf(lastId);
        return { parentId, positionInChildren: idx >= 0 ? idx + 1 : -1 };
    }

    return { parentId: "root", positionInChildren: -1 };
}


function collectDescendants(id: string, result: { id: string, positionInChildren: number }[]) {
    const store = surfaceStore(id);
    const surface = get(store);
    
    if (surface.type === "Group") {
        for (const childId of surface.children) {
            collectDescendants(childId, result);
        }
    }

    const siblings = surface.parentId === "root" ? get(rootSurfaces).children : (get(surfaceStore(surface.parentId)) as GroupSurface).children
    const positionInChildren = siblings.indexOf(id);

    result.push({ id, positionInChildren });
}

export function deleteSurfaceAndChildren(id: string): { surface: Surface, positionInChildren: number }[] {

    const store = surfaceStore(id);
    const surface = get(store);

    const itemsToDelete: { id: string, positionInChildren: number }[] = [];
    collectDescendants(id, itemsToDelete);

    if (surface.parentId !== "root") {
        const parent = surfaceStore(surface.parentId);
        parent.update(s => {
            if (s.type === "Group") {
                return {
                    ...s,
                    children: s.children.filter(cid => cid !== id)
                };
            }
            return s;
        });
    }
    else {
        rootSurfaces.update(r => ({
            ...r,
            children: r.children.filter(cid => cid !== id)
        }));
    }


    const deletedSurfaces = itemsToDelete.map(({ id, positionInChildren }) => ({
        surface: structuredClone(get(surfaceStore(id))),
        positionInChildren
    }));
    itemsToDelete.forEach(({ id }) => deleteSurfaceStore(id));    

    return deletedSurfaces;
}