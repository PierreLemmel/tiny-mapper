import { eventStore } from "../event-store";
import { addSurface, deleteSurfaceAndChildren, type Surface } from "../../logic/surfaces";
import type { ApplySurfacePropertyData, SurfaceCreated, SurfaceDeleted, SurfacePropertyEvent, SurfaceTreeMoved } from "./surfaces-event-types";
import { applySurfaceTreeSnapshot } from "./surface-tree-snapshot";
import { surfaceStore } from "../../stores/surfaces";
import { surfaceUI } from "../../stores/user-interface";



function applySurfaceProperty<K extends keyof Surface>(data: ApplySurfacePropertyData<K>) {
    const { surfaceId, ...property } = data;

    surfaceStore(data.surfaceId).update(s => {
        return { ...s, ...property };
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
            for (const { surface, positionInChildren } of data.deletedSurfaces) {
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
}
