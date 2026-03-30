import type { AppEvent } from "../event-store";
import type { Surface } from "../../logic/surfaces";
import type { SurfaceTreeSnapshot } from "./surface-tree-snapshot";


export type ApplySurfacePropertyData<K extends keyof Surface> = {
    surfaceId: string,
} & Pick<Surface, K>;


export type SurfacePropertyEvent<K extends keyof Surface> = AppEvent<"Surface", `${Capitalize<K>}Changed`,
    ApplySurfacePropertyData<K>,
    ApplySurfacePropertyData<K>>;


export type SurfaceNameChanged = SurfacePropertyEvent<"name">;
export type SurfaceEnabledChanged = SurfacePropertyEvent<"enabled">;
export type SurfaceOpacityChanged = SurfacePropertyEvent<"opacity">;
export type SurfaceBlendModeChanged = SurfacePropertyEvent<"blendMode">;
export type SurfaceColorChanged = SurfacePropertyEvent<"color">;
export type SurfaceFlipChanged = SurfacePropertyEvent<"flip">;
export type SurfaceFeatheringChanged = SurfacePropertyEvent<"feathering">;

export type SurfaceCreated = AppEvent<"Surface", "Created", {
    surface: Surface,
}, {
    surfaceId: string,
}>;

export type SurfaceDeleted = AppEvent<"Surface", "Deleted", {
    surfaceIds: string[],
}, {
    deletedSurfaces: {
        surface: Surface,
        positionInChildren: number,
    }[],
}>;

export type SurfaceTreeMoved = AppEvent<"Surface", "TreeMoved",
    SurfaceTreeSnapshot,
    SurfaceTreeSnapshot
>;