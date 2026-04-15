import * as THREE from "three";

export const blendModeValues = ["Over", "Add", "Multiply", "Subtract"] as const;
export type BlendMode = typeof blendModeValues[number];

export type Position = [number, number]
export type Delta = [number, number]
export type Scale = [number, number]

export type UV = [number, number]

export type SurfaceFlip = [boolean, boolean]

export type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const SCREEN_X_MIN = -999.99;
export const SCREEN_X_MAX = 999.99;
export const SCREEN_Y_MIN = -999.99;
export const SCREEN_Y_MAX = 999.99;

export function flipSurface(flip: SurfaceFlip, flipSurface: SurfaceFlip): SurfaceFlip {
    return [flip[0] !== flipSurface[0], flip[1] !== flipSurface[1]];
}

export function positionsToFloat32Array(positions: Position[]): Float32Array {

    const count = positions.length;
    const result = Float32Array.from({ length: positions.length * 3 })
    for (let i = 0; i < count; i++) {
        result.set(positions[i], i * 3);
        result.set([0], i * 3 + 2);
    }
    return result;
}

export function indicesToUint32Array(indices: number[]): Uint32Array {
    return new Uint32Array(indices);
}

export function uvsToFloat32Array(uvs: UV[]): Float32Array {
    return new Float32Array(uvs.flat());
}

export function blendModeToThreeBlendMode(blendMode: BlendMode): THREE.Blending {
    switch (blendMode) {
        case "Over":
            return THREE.NormalBlending;
        case "Add":
            return THREE.AdditiveBlending;
        case "Multiply":
            return THREE.MultiplyBlending;
        case "Subtract":
            return THREE.SubtractiveBlending;
    }
}

export function requiresPremultipliedAlpha(blendMode: BlendMode): boolean {
    return blendMode === "Multiply" || blendMode === "Subtract";
}