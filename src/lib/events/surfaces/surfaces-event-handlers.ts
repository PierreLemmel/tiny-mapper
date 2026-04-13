import { eventStore } from "../event-store";
import { addSurface, deleteSurfaceAndChildren, type Surface, type SurfaceTransform } from "../../logic/surfaces/surfaces";
import type { ApplySurfacePropertyData, ApplySurfaceTransformPropertyData, SurfaceCreated, SurfaceDeleted, SurfaceGeometryVertexChanged, SurfaceGeometryVertexChangedEventData, SurfaceMaterialChanged, SurfaceMaterialChangedEventData, SurfacePropertyEvent, SurfacesTranslated, SurfacesTranslatedEventData, SurfaceTransformPropertyEvent, SurfaceTreeMoved } from "./surfaces-event-types";
import { applySurfaceTreeSnapshot } from "../../logic/surfaces/surface-tree-snapshot";
import { surfaceGeometryStore, surfaceStore } from "../../stores/surfaces";
import { surfaceUI } from "../../stores/user-interface";



function applySurfaceProperty<K extends keyof Surface>(data: ApplySurfacePropertyData<K>) {
    const { surfaceId, ...property } = data;

    surfaceStore(data.surfaceId).update(s => {
        return { ...s, ...property };
    });
}

function applySurfaceTransformProperty<K extends keyof SurfaceTransform>(data: ApplySurfaceTransformPropertyData<K>) {
    const { surfaceId, ...property } = data;

    surfaceStore(data.surfaceId).update(s => {
        
        const transform: SurfaceTransform = {
            ...structuredClone(s.transform),
            ...property
        };

        return { ...s, transform };
    });
}

function applySurfacesTranslated(stead: SurfacesTranslatedEventData) {
    for (const { surfaceId, position } of stead.data) {
        surfaceStore(surfaceId).update(s => {

            const transform: SurfaceTransform = {
                ...structuredClone(s.transform),
                position
            };

            return { ...s, transform };
        });
    }
}

function applySurfaceMaterialId(data: SurfaceMaterialChangedEventData) {
    const { surfaceId, materialId } = data;
    surfaceStore(surfaceId).update(s => {
        if (s.type !== "Quad") {
            return s;
        }
        return { ...s, materialId };
    });
}

function applySurfaceGeometryVertexChanged(data: SurfaceGeometryVertexChangedEventData) {
    const { surfaceId, vertices } = data;

    surfaceGeometryStore(surfaceId).update(g => {
        const {
            vertices: oldVertices,
            ...rest
        } = g;
        
        const newVertices = structuredClone(oldVertices);
        for (const { index, value } of vertices) {
            newVertices[index] = value;
        }
        return {
            ...rest,
            vertices: newVertices
        };
    });
}

function registerSurfacePropertyHandler<K extends keyof Surface>(
    property: K,
    forward: (data: ApplySurfacePropertyData<K>) => void,
    backward: (data: ApplySurfacePropertyData<K>) => void
) {
    eventStore.registerHandler<SurfacePropertyEvent<K>>("Surface", `${property.charAt(0).toUpperCase() + property.slice(1)}Changed` as `${Capitalize<K>}Changed`,
        forward,
        backward
    );
}

function registerSurfaceTransformPropertyHandler<K extends keyof SurfaceTransform>(
    property: K,
    forward: (data: ApplySurfaceTransformPropertyData<K>) => void,
    backward: (data: ApplySurfaceTransformPropertyData<K>) => void
) {
    eventStore.registerHandler<SurfaceTransformPropertyEvent<K>>("Surface", `${property.charAt(0).toUpperCase() + property.slice(1)}Changed` as `${Capitalize<K>}Changed`,
        forward,
        backward
    );
}


export function registerSurfacesEventHandlers() {
    registerSurfacePropertyHandler(
        "name",
        (data) => applySurfaceProperty(data),
        (data) => applySurfaceProperty(data)
    );

    registerSurfacePropertyHandler(
        "enabled",
        (data) => applySurfaceProperty(data),
        (data) => applySurfaceProperty(data)
    );

    registerSurfacePropertyHandler(
        "opacity",
        (data) => applySurfaceProperty(data),
        (data) => applySurfaceProperty(data)
    );

    registerSurfacePropertyHandler(
        "color",
        (data) => applySurfaceProperty(data),
        (data) => applySurfaceProperty(data)
    );

    registerSurfacePropertyHandler(
        "flip",
        (data) => applySurfaceProperty(data),
        (data) => applySurfaceProperty(data)
    );

    registerSurfacePropertyHandler(
        "blendMode",
        (data) => applySurfaceProperty(data),
        (data) => applySurfaceProperty(data)
    );
    
    registerSurfacePropertyHandler(
        "feathering",
        (data) => applySurfaceProperty(data),
        (data) => applySurfaceProperty(data)
    );

    
    registerSurfaceTransformPropertyHandler(
        "position",
        (data) => applySurfaceTransformProperty(data),
        (data) => applySurfaceTransformProperty(data)
    )

    registerSurfaceTransformPropertyHandler(
        "scale",
        (data) => applySurfaceTransformProperty(data),
        (data) => applySurfaceTransformProperty(data)
    );

    registerSurfaceTransformPropertyHandler(
        "rotation",
        (data) => applySurfaceTransformProperty(data),
        (data) => applySurfaceTransformProperty(data)
    );

    eventStore.registerHandler<SurfaceCreated>(
        "Surface",
        "Created",
        (data) => addSurface(data.surface),
        (data) => {
            deleteSurfaceAndChildren(data.surfaceId)
            surfaceUI.update(ui => ({
                ...ui,
                selectedSurfaces: ui.selectedSurfaces.filter(id => id !== data.surfaceId),
            }))
        }
    );

    eventStore.registerHandler<SurfaceDeleted>(
        "Surface",
        "Deleted",
        (data) => {
            for (const id of data.surfaceIds) {
                deleteSurfaceAndChildren(id)
            }
        },
        (data) => {
            for (const { surface, positionInChildren } of data.deletedSurfaces.reverse()) {
                addSurface(surface, positionInChildren)
            }
        }
    );

    eventStore.registerHandler<SurfaceTreeMoved>(
        "Surface",
        "TreeMoved",
        (data) => applySurfaceTreeSnapshot(data),
        (data) => applySurfaceTreeSnapshot(data)
    );

    eventStore.registerHandler<SurfacesTranslated>(
        "Surface",
        "Translated",
        (data) => applySurfacesTranslated(data),
        (data) => applySurfacesTranslated(data)
    );

    eventStore.registerHandler<SurfaceGeometryVertexChanged>(
        "Surface",
        "GeometryVertexChanged",
        (data) => applySurfaceGeometryVertexChanged(data),
        (data) => applySurfaceGeometryVertexChanged(data)
    );

    eventStore.registerHandler<SurfaceMaterialChanged>(
        "Surface",
        "MaterialChanged",
        (data) => applySurfaceMaterialId(data),
        (data) => applySurfaceMaterialId(data)
    );
}