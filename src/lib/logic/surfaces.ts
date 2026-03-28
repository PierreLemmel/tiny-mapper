import {
    addSurfaceToStores,
    deleteSurfaceStore,
    getAllSurfaces,
    rootSurfaces,
    surfaceStore,
} from "../stores/surfaces";
import { eventStore } from "../events/event-store";
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

export function createQuadSurface() {
    
    const name = nextAvailableName("Quad")

    const surface: QuadSurface = {
        name,
        type: "Quad",
        ...createSurfaceBase(),
        transform: createDefaultSurfaceTransform()
    }

    eventStore.push({
        category: "Surface",
        type: "Created",
        forwardData: { surface: structuredClone(surface), parentId: "root" },
        backwardData: { surfaceId: surface.id },
    })

    addSurfaceToStores(surface.id, surface);
    rootSurfaces.update(r => ({
        ...r,
        children: [...r.children, surface.id]
    }));
}

export function createGroupSurface() {
    const name = nextAvailableName("Group")

    const surface: GroupSurface = {
        name,
        type: "Group",
        ...createSurfaceBase(),
        children: []
    }

    addSurfaceToStores(surface.id, surface)

    eventStore.push({
        category: "Surface",
        type: "Created",
        forwardData: { surface: structuredClone(surface), parentId: "root" },
        backwardData: { surfaceId: surface.id },
    })

    rootSurfaces.update(r => ({
        ...r,
        children: [...r.children, surface.id]
    }));
}

export function createRootSurface(): RootSurface {
    return {
        type: "Root",
        id: "root",
        children: []
    }
}


export function collectDescendants(id: string, result: string[]) {
    const store = surfaceStore(id);
    const surface = get(store);
    if (surface.type === "Group") {
        for (const childId of surface.children) {
            collectDescendants(childId, result);
        }
    }
    result.push(id);
}

export function deleteSurfaceAndChildren(id: string): string[] {

    const store = surfaceStore(id);
    const surface = get(store);

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

    const idsToDelete: string[] = [];
    collectDescendants(id, idsToDelete);
    
    idsToDelete.forEach(deleteSurfaceStore);

    return idsToDelete;
}