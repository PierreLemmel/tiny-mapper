import { get } from "svelte/store";
import { surfaceStore } from "../../stores/surfaces";
import type { Delta } from "../mapping";
import { topLevelSelectedSurfaces } from "./surface-selection";
import { surfaceUI, type SurfaceUIData } from "../../stores/user-interface";

function translateSurface(surfaceId: string, delta: Delta) {
    surfaceStore(surfaceId).update(s => {
        return {
            ...s,
            transform: {
                ...s.transform,
                position: [s.transform.position[0] + delta[0], s.transform.position[1] + delta[1]]
            }
        };
    });
}

export function translateSelectedSurfaces(delta: Delta) {
    for (const surface of get(topLevelSelectedSurfaces)) {
        translateSurface(surface, delta);
    }
}

export function selectSurfaceHandles(handles: {surfaceId: string, handles: number[]}[], mode: "Replace" | "Add" | "Toggle") {
    surfaceUI.update(ui => {
        const resultHandles = applySelectedHandles(ui.selectedHandles, handles, mode);
        return { ...ui, selectedHandles: resultHandles };
    });
}

function applySelectedHandles(existingHandles: SurfaceUIData['selectedHandles'], newHandles: {surfaceId: string, handles: number[]}[], mode: "Replace" | "Add" | "Toggle"): SurfaceUIData['selectedHandles'] {
    
    if (mode === "Replace") {
        return newHandles.reduce((acc, {surfaceId, handles}) => {
            acc[surfaceId] = handles;
            return acc;
        }, {} as SurfaceUIData['selectedHandles']);
    }
    else {
        
        const resultHandles = structuredClone(existingHandles);
        if (mode === "Add") {

            for (const { surfaceId, handles } of newHandles) {
                if (resultHandles[surfaceId]) {
                    const set = new Set(resultHandles[surfaceId]);
                    for (const handle of handles) {
                        if (!set.has(handle)) {
                            set.add(handle);
                        }
                    }
                    resultHandles[surfaceId] = Array.from(set);
                }
                else {
                    resultHandles[surfaceId] = [...handles];
                }
            }

        }
        else {
            for (const { surfaceId, handles } of newHandles) {
                if (resultHandles[surfaceId]) {
                    const set = new Set(resultHandles[surfaceId]);

                    for (const handle of handles) {
                        if (set.has(handle)) {
                            set.delete(handle);
                        }
                        else {
                            set.add(handle);
                        }
                    }
                    resultHandles[surfaceId] = Array.from(set);
                }
                else {
                    resultHandles[surfaceId] = [...handles];
                }
            }
        }

        return resultHandles;
    }

}

export function clearSelectedHandlesForUnselectedSurfaces() {
    surfaceUI.update(ui => {
        const resultHandles = structuredClone(ui.selectedHandles);
        const selectedSurfaces = new Set(ui.selectedSurfaces);
        for (const surfaceId in resultHandles) {
            if (!selectedSurfaces.has(surfaceId)) {
                delete resultHandles[surfaceId];
            }
        }

        return { ...ui, selectedHandles: resultHandles };
    });
}

export function filterSelectedHandles(existingHandles: SurfaceUIData['selectedHandles'], surfaceIds: string[]): SurfaceUIData['selectedHandles'] {
    const resultHandles = structuredClone(existingHandles);
    const selectedSurfaces = new Set(surfaceIds);
    for (const surfaceId in resultHandles) {
        if (!selectedSurfaces.has(surfaceId)) {
            delete resultHandles[surfaceId];
        }
    }
    return resultHandles;
}

export function clearSelectedHandlesForSurfaces(surfaceIds: string[]) {
    surfaceUI.update(ui => {
        const resultHandles = structuredClone(ui.selectedHandles);
        for (const surfaceId of surfaceIds) {
            if (resultHandles[surfaceId]) {
                delete resultHandles[surfaceId];
            }
        }
        return { ...ui, selectedHandles: resultHandles };
    });
}

export function clearAllSelectedHandles() {
    surfaceUI.update(ui => ({ ...ui, selectedHandles: {} }));
}