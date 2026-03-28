import { eventStore, type AppEvent } from "../event-store";
import type { Surface } from "../../logic/surfaces";
import type { ApplySurfacePropertyData, SurfacePropertyEvent } from "./surfaces-event-types";



function applySurfaceProperty<K extends keyof Surface>(data: ApplySurfacePropertyData<K>) {
    const surfaceId = data.surfaceId;
}

function applyTreeStructure(
    rootSurfaces: string[],
    groupChildren: Record<string, string[]>
) {
    // content.update(c => {
    //     const surfaces = { ...c.surfaces };

    //     for (const id of rootSurfaces) {
    //         if (surfaces[id]) {
    //             surfaces[id] = { ...surfaces[id], parentId: "root" };
    //         }
    //     }

    //     for (const [groupId, children] of Object.entries(groupChildren)) {
    //         const group = surfaces[groupId];
    //         if (group && group.type === "Group") {
    //             surfaces[groupId] = { ...group, children };
    //             for (const childId of children) {
    //                 if (surfaces[childId]) {
    //                     surfaces[childId] = { ...surfaces[childId], parentId: groupId };
    //                 }
    //             }
    //         }
    //     }

    //     return { ...c, surfaces, rootSurfaces };
    // });
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

    // eventStore.registerHandler("Surface", "Created",
    //     (data) => {
    //         content.update(c => {
    //             const surfaces = { ...c.surfaces, [data.surface.id]: data.surface };
    //             let rootSurfaces = c.rootSurfaces;
    //             if (data.parentId === null) {
    //                 rootSurfaces = [...rootSurfaces, data.surface.id];
    //             } else {
    //                 const group = surfaces[data.parentId];
    //                 if (group && group.type === "Group") {
    //                     surfaces[data.parentId] = {
    //                         ...group,
    //                         children: [...group.children, data.surface.id]
    //                     };
    //                 }
    //             }
    //             return { ...c, surfaces, rootSurfaces };
    //         });
    //     },
    //     (data) => {
    //         content.update(c => {
    //             const surfaces = { ...c.surfaces };
    //             delete surfaces[data.surfaceId];
    //             const rootSurfaces = c.rootSurfaces.filter(id => id !== data.surfaceId);
    //             for (const surface of Object.values(surfaces)) {
    //                 if (surface.type === "Group" && surface.children.includes(data.surfaceId)) {
    //                     surfaces[surface.id] = {
    //                         ...surface,
    //                         children: surface.children.filter(id => id !== data.surfaceId)
    //                     };
    //                 }
    //             }
    //             return { ...c, surfaces, rootSurfaces };
    //         });
    //     }
    // );

    // eventStore.registerHandler("Surface", "Deleted",
    //     (data) => {
    //         content.update(c => {
    //             const surfaces = { ...c.surfaces };
    //             for (const id of data.surfaceIds) {
    //                 delete surfaces[id];
    //             }
    //             const deleteSet = new Set(data.surfaceIds);
    //             const rootSurfaces = c.rootSurfaces.filter(id => !deleteSet.has(id));
    //             for (const surface of Object.values(surfaces)) {
    //                 if (surface.type === "Group") {
    //                     const filtered = surface.children.filter(id => !deleteSet.has(id));
    //                     if (filtered.length !== surface.children.length) {
    //                         surfaces[surface.id] = { ...surface, children: filtered };
    //                     }
    //                 }
    //             }
    //             return { ...c, surfaces, rootSurfaces };
    //         });
    //     },
    //     (data) => {
    //         content.update(c => {
    //             const surfaces = { ...c.surfaces };
    //             for (const surface of data.deletedSurfaces) {
    //                 surfaces[surface.id] = surface;
    //             }
    //             for (const [groupId, children] of Object.entries(data.parentChildren)) {
    //                 const group = surfaces[groupId];
    //                 if (group && group.type === "Group") {
    //                     surfaces[groupId] = { ...group, children };
    //                 }
    //             }
    //             return { ...c, surfaces, rootSurfaces: data.rootSurfaces };
    //         });
    //     }
    // );

    // eventStore.registerHandler("Surface", "Reordered",
    //     (data) => applyTreeStructure(data.rootSurfaces, data.groupChildren),
    //     (data) => applyTreeStructure(data.rootSurfaces, data.groupChildren)
    // );
}
