import { derived, get } from "svelte/store";
import { surfaceUI } from "../../stores/user-interface";
import { rootSurfaces, surfaceStore } from "../../stores/surfaces";
import { eventStore } from "../../events/event-store";
import type { SurfaceDeleted } from "../../events/surfaces/surfaces-event-types";
import { deleteSurfaceAndChildren } from "./surfaces";
import { log } from "../../logging/logger";
import { filterSelectedHandles } from "./surface-edit";

let selectionAnchor: string | null = null;

export const topLevelSelectedSurfaces = derived(surfaceUI, ui => getTopLevelSelectedSurfaces(ui.selectedSurfaces));

function getTopLevelSelectedSurfaces(selected: string[]): string[] {
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
                selectedHandles: filterSelectedHandles(ui.selectedHandles, rangeIds),
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
            selectedHandles: filterSelectedHandles(ui.selectedHandles, [id]),
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
        selectedHandles: filterSelectedHandles(ui.selectedHandles, [id]),
    }));
    selectionAnchor = id;
}

export function selectAllSurfaces() {
    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: getFlatVisualOrder(),
    }));

    selectionAnchor = null;
}

export function clearSelection() {
    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: [],
        selectedHandles: {},
    }));
    selectionAnchor = null;
}

export function selectNextSurface(modifiers?: Partial<SelectSurfaceModifiers>) {
    let idx = 0;
    const flatOrder = getFlatVisualOrder();

    if (selectionAnchor) {
        const anchorIdx = flatOrder.indexOf(selectionAnchor);
        idx = (anchorIdx + 1) % flatOrder.length;
    }

    const mod = {
        ctrlKey: false, shiftKey: false, metaKey: false,
        ...(modifiers || {})
    };

    selectSurface(flatOrder[idx], mod);
}

export function selectPreviousSurface(modifiers?: Partial<SelectSurfaceModifiers>) {
    let idx = 0;
    const flatOrder = getFlatVisualOrder();

    if (selectionAnchor) {
        const anchorIdx = flatOrder.indexOf(selectionAnchor);
        idx = (anchorIdx - 1 + flatOrder.length) % flatOrder.length;
    }

    const mod = {
        ctrlKey: false, shiftKey: false, metaKey: false,
        ...(modifiers || {})
    };

    selectSurface(flatOrder[idx], mod);
}




export function deleteSelectedSurfaces() {
    const selected = get(surfaceUI).selectedSurfaces;
    if (selected.length === 0) return;

    const topLevel = get(topLevelSelectedSurfaces);

    const deletedSurfaces = topLevel.flatMap(id => deleteSurfaceAndChildren(id));

    const deletedSet = new Set(deletedSurfaces.map(s => s.surface.id));
    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: [],
        selectedHandles: {},
        collapsedGroups: ui.collapsedGroups.filter(id => !deletedSet.has(id)),
    }));

    eventStore.push<SurfaceDeleted>({
        category: "Surface",
        type: "Deleted",
        forwardData: { surfaceIds: [...topLevel] },
        backwardData: {
            deletedSurfaces,
        },
    });


    selectionAnchor = null;
}

export function belongsToCurrentSelection(id: string): boolean {
    const topLvl = new Set(get(topLevelSelectedSurfaces));

    let checkedId = id;

    while (checkedId !== "root") {
        if (topLvl.has(checkedId)) return true;
        checkedId = get(surfaceStore(checkedId)).parentId;
    }
    return false;
}