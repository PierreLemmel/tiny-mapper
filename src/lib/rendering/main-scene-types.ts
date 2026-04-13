import type { BufferGeometry, Group, Mesh, ShaderMaterial } from "three";
import type { SurfaceFlip } from "../logic/mapping";
import type { RawColor } from "../core/color";

export type QuadSurfaceRenderData = {
    mesh: Mesh;
    material: ShaderMaterial;
    geometry: BufferGeometry;
    unsubscribe: () => void;
};

export type GroupSurfaceRenderData = {
    group: Group;
    hierarchyData: HierarchyData;
    unsubscribe: () => void;
};

export type HierarchyData = Readonly<{
    opacity: number;
    color: RawColor;
    flip: SurfaceFlip;
    feathering: number;
}>;

export function defaultHierarchyData(): HierarchyData {
    return {
        opacity: 1,
        color: [1, 1, 1, 1],
        flip: [false, false],
        feathering: 0,
    };
}

export type MainSceneHandlePickEntry = {
    surfaceId: string;
    vertexIndex: number;
};
