import type { AppEvent } from "../event-store";
import type { Surface, SurfaceTransform } from "../../logic/surfaces/surfaces";
import type { SurfaceTreeSnapshot } from "../../logic/surfaces/surface-tree-snapshot";
import type { Delta, Position } from "../../logic/mapping";


export type ApplySurfacePropertyData<K extends keyof Surface> = {
    surfaceId: string,
} & Pick<Surface, K>;


export type ApplySurfaceTransformPropertyData<K extends keyof SurfaceTransform> = {
    surfaceId: string,
} & Pick<SurfaceTransform, K>;

export type SurfacePropertyEvent<K extends keyof Surface> = AppEvent<"Surface", `${Capitalize<K>}Changed`,
    ApplySurfacePropertyData<K>,
    ApplySurfacePropertyData<K>>;

export type SurfaceTransformPropertyEvent<K extends keyof SurfaceTransform> = AppEvent<"Surface", `${Capitalize<K>}Changed`,
    ApplySurfaceTransformPropertyData<K>,
    ApplySurfaceTransformPropertyData<K>>;

export type SurfacePositionChanged = SurfaceTransformPropertyEvent<"position">;
export type SurfaceScaleChanged = SurfaceTransformPropertyEvent<"scale">;
export type SurfaceRotationChanged = SurfaceTransformPropertyEvent<"rotation">;

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

export type SurfacesTranslatedEventData = {
    data: {
        surfaceId: string,
        position: Position,
    }[],
}

export type SurfacesTranslated = AppEvent<"Surface", "Translated", SurfacesTranslatedEventData, SurfacesTranslatedEventData>