import {
    addSurfaceToStores,
    deleteSurfaceStore,
    getAllSurfaces,
    rootSurfaces,
    surfaceStore,
} from "../stores/surfaces";
import type { BlendMode, Position, Scale, Size, SurfaceFlip } from "./mapping";
import type { RawColor } from "../core/color";
import { createId } from "../core/utils";
import { get } from "svelte/store";

const DEFAULT_SIZE: Size = [100, 100]

export type SurfaceTransform = {
    position: Position;
    scale: Scale;
    rotation: number;
}

type SurfaceBase = {
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
        scale: [...DEFAULT_SIZE],
        rotation: 0
    }
}

export function addSurface(surface: Surface, positionInChildren: number = -1) {
    switch (surface.type) {
        case "Quad":
            return createQuadSurface(surface, positionInChildren);
        case "Group":
            return createGroupSurface(surface, positionInChildren);
    }
}

function bindSurfaceToParent(surface: Surface, positionInChildren: number = -1) {
    if (surface.parentId === "root") {
        rootSurfaces.update(r => ({
            ...r,
            children: positionInChildren === -1 ?
                [...r.children, surface.id] :
                [...r.children.slice(0, positionInChildren), surface.id, ...r.children.slice(positionInChildren)]
        }));
    }
    else {
        surfaceStore(surface.parentId)
            .update(s => {
                if (s.type !== "Group") {
                    return s
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


function collectDescendants(id: string, result: { id: string, positionInChildren: number }[]) {
    const store = surfaceStore(id);
    const surface = get(store);
    if (surface.type === "Group") {
        for (const childId of surface.children) {
            collectDescendants(childId, result);
        }
    }

    const parent = get(surfaceStore(surface.parentId));
    const positionInChildren = parent.type === "Group" ? parent.children.indexOf(id) : -1;

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