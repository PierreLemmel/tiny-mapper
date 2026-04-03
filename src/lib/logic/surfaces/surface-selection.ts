import { get } from "svelte/store";
import { surfaceUI } from "../../stores/user-interface";
import { rootSurfaces, surfaceStore } from "../../stores/surfaces";
import { eventStore } from "../../events/event-store";
import type { SurfaceDeleted } from "../../events/surfaces/surfaces-event-types";
import { deleteSurfaceAndChildren } from "./surfaces";

let selectionAnchor: string | null = null;

function getFlatVisualOrder(): string[] {

    const collapsed = new Set(get(surfaceUI).collapsedGroups);
    const result: string[] = [];

    function walk(id: string) {
        result.push(id);
        const store = surfaceStore(id);
        const surface = get(store);
        if (surface && surface.type === "Group" && !collapsed.has(id)) {
            for (const childId of surface.children) {
                walk(childId);
            }
        }
    }

    const root = get(rootSurfaces);
    for (const id of root.children) {
        walk(id);
    }

    return result;
}

export type SelectSurfaceModifiers = {
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

export type SelectSurfaceOptions = {
    allowShiftAnchoring: boolean;
}
export function selectSurface(id: string, modifiers: SelectSurfaceModifiers, options?: Partial<SelectSurfaceOptions>) {
    const isCtrl = modifiers.ctrlKey || modifiers.metaKey;
    const isShift = modifiers.shiftKey;

    const { allowShiftAnchoring = true } = options || {};
    
    if ((isShift && allowShiftAnchoring) && selectionAnchor ) {
        const flatOrder = getFlatVisualOrder();
        const anchorIdx = flatOrder.indexOf(selectionAnchor);
        const clickedIdx = flatOrder.indexOf(id);

        if (anchorIdx >= 0 && clickedIdx >= 0) {
            const start = Math.min(anchorIdx, clickedIdx);
            const end = Math.max(anchorIdx, clickedIdx);
            const rangeIds = flatOrder.slice(start, end + 1);

            surfaceUI.update(ui => ({
                ...ui,
                selectedSurfaces: rangeIds,
            }));
        }
        return;
    }

    if (isCtrl || (isShift && !allowShiftAnchoring)) {
        surfaceUI.update(ui => ({
            ...ui,
            selectedSurfaces: ui.selectedSurfaces.includes(id)
                ? ui.selectedSurfaces.filter(s => s !== id)
                : [...ui.selectedSurfaces, id],
        }));
        selectionAnchor = id;
        return;
    }

    const current = get(surfaceUI).selectedSurfaces;
    if (current.length === 1 && current[0] === id) {
        clearSelection();
        return;
    }

    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: [id],
    }));
    selectionAnchor = id;
}

export function clearSelection() {
    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: [],
    }));
    selectionAnchor = null;
}

export function getTopLevelSelectedSurfaces(selected: string[]): string[] {
    const selectedSet = new Set(selected);
    return selected.filter(id => {

        let parentId = get(surfaceStore(id)).parentId;
        while (parentId && parentId !== "root") {
            if (selectedSet.has(parentId)) return false;
            parentId = get(surfaceStore(parentId)).parentId;
        }
        return true;
    });
}

export function deleteSelectedSurfaces() {
    const selected = get(surfaceUI).selectedSurfaces;
    if (selected.length === 0) return;

    const topLevel = getTopLevelSelectedSurfaces(selected);

    const deletedSurfaces = topLevel.flatMap(id => deleteSurfaceAndChildren(id));

    eventStore.push<SurfaceDeleted>({
        category: "Surface",
        type: "Deleted",
        forwardData: { surfaceIds: [...topLevel] },
        backwardData: {
            deletedSurfaces,
        },
    });


    const deletedSet = new Set(deletedSurfaces.map(s => s.surface.id));
    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: [],
        collapsedGroups: ui.collapsedGroups.filter(id => !deletedSet.has(id)),
    }));

    selectionAnchor = null;
}
