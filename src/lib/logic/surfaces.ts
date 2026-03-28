import { get } from "svelte/store";
import {
    surfaces as surfacesData,
    rootSurfaces as rootSurfacesData,
} from "../stores/content";
import { eventStore } from "../events/event-store";
import type { BlendMode, Position, Scale, Size, SurfaceFlip } from "./mapping";
import type { RawColor } from "../core/color";
import { createId } from "../core/utils";

const DEFAULT_SIZE: Size = [100, 100]

export type SurfaceTransform = {
    position: Position;
    scale: Scale;
    rotation: number;
}

type SurfaceBase = {
    id: string;
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

export type SurfaceType = "Group"|"Quad"

type SurfaceData<T extends SurfaceType, D> = { type: T } & SurfaceBase & D

export type QuadSurface = SurfaceData<"Quad", {
}>

export type GroupSurface = SurfaceData<"Group", {
    children: string[]
}>

export type Surface = QuadSurface | GroupSurface

const MAX_ITERATIONS = 1000

function nextAvailableName(type: SurfaceType) {
    let i = 1;

    const lowerType = type.toLowerCase()

    const existingNames = Object.values(get(surfacesData))
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

    const surfaces = get(surfacesData)
    const rootSurfaces = get(rootSurfacesData)

    const newSurfaces = {
        ...surfaces,
        [surface.id]: surface
    }

    const newRootSurfaces = [
        ...rootSurfaces,
        surface.id
    ]

    surfacesData.set(newSurfaces)
    rootSurfacesData.set(newRootSurfaces)

    eventStore.push({
        category: "Surface",
        type: "Created",
        forwardData: { surface: structuredClone(surface), parentId: "root" },
        backwardData: { surfaceId: surface.id },
    })
}

export function createGroupSurface() {
    const name = nextAvailableName("Group")

    const surface: GroupSurface = {
        name,
        type: "Group",
        ...createSurfaceBase(),
        children: []
    }

    const surfaces = get(surfacesData)
    const rootSurfaces = get(rootSurfacesData)

    const newSurfaces = {
        ...surfaces,
        [surface.id]: surface
    }

    const newRootSurfaces = [
        ...rootSurfaces,
        surface.id
    ]

    surfacesData.set(newSurfaces)
    rootSurfacesData.set(newRootSurfaces)

    eventStore.push({
        category: "Surface",
        type: "Created",
        forwardData: { surface: structuredClone(surface), parentId: "root" },
        backwardData: { surfaceId: surface.id },
    })
}

export function updateSurface(id: string, values: Partial<Surface>) {
    const surfaces = get(surfacesData);

    if (!surfaces[id]) {
        throw new Error(`Can't find surface with id '${id}'`)
    }

    const newSurfaces = structuredClone(surfaces);
    const surface: Surface = newSurfaces[id]

    
    
    newSurfaces[id] = surface;
}