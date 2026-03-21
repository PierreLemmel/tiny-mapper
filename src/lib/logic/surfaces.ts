import { get } from "svelte/store";
import { content } from "../stores/content";
import type { BlendMode, Color, Position, Size } from "./mapping";
import { generateUUID } from "three/src/math/MathUtils.js";

const DEFAULT_SIZE: Size = [100, 100]

export type SurfaceOutput = {
    position: Position;
    size: Size;
    rotation: number;
}

type SurfaceBase = {
    id: string;
    enabled: boolean;
    name: string;
    opacity: number;
    color: Color;
    blendMode: BlendMode;
}

export type SurfaceType = "Group"|"Quad"

type SurfaceData<T extends SurfaceType, D> = { type: T } & SurfaceBase & D

export type QuadSurface = SurfaceData<"Quad", {
    output: SurfaceOutput
}>

export type GroupSurface = SurfaceData<"Group", {
    children: string[]
}>

export type Surface = QuadSurface | GroupSurface

const MAX_ITERATIONS = 1000

function nextAvailableName(type: SurfaceType) {
    let i = 1;

    const lowerType = type.toLowerCase()

    const existingNames = Object.values(get(content).surfaces)
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
        id: generateUUID(),
        enabled: true,
        opacity: 1,
        color: [1, 1, 1, 1],
        blendMode: "Over"
    }
}

function createDefaultSurfaceOutput(): SurfaceOutput {
    return {
        position: [0, 0],
        size: [...DEFAULT_SIZE],
        rotation: 0
    }
}

export function createQuadSurface() {
    
    const name = nextAvailableName("Quad")

    const surface: QuadSurface = {
        name,
        type: "Quad",
        ...createSurfaceBase(),
        output: createDefaultSurfaceOutput()
    }

    const {
        surfaces,
        rootSurfaces,
        ...contentRest
    } = get(content)

    const newSurfaces = {
        ...surfaces,
        [surface.id]: surface
    }

    const newRootSurfaces = [
        ...rootSurfaces,
        surface.id
    ]

    content.set({
        ...contentRest,
        surfaces: newSurfaces,
        rootSurfaces: newRootSurfaces
    })
}

export function createGroupSurface() {
    console.log("Create group")
}