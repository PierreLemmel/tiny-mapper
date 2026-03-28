import { get, writable } from "svelte/store";
import { TRIGGERS } from "svelte-dnd-action";

import { eventStore } from "../../../lib/events/event-store";
import { surfaceUI } from "../../../lib/stores/user-interface";
import type { PointerModifiers } from "../../../lib/ui/longpress-action";
import { rootSurfaces, surfaceStore } from "../../../lib/stores/surfaces";
import { deleteSurfaceAndChildren } from "../../../lib/logic/surfaces";


export type SurfaceDisplayTreeItem = {
    id: string;
    isDndShadowItem?: boolean;
}

export const activeDragCompanions = writable<Set<string>>(new Set());
export const renameRequestId = writable<string | null>(null);

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

export function selectSurface(id: string, modifiers: PointerModifiers) {
    const isCtrl = modifiers.ctrlKey || modifiers.metaKey;

    if (modifiers.shiftKey && selectionAnchor) {
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

    if (isCtrl) {
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

export function toggleGroupCollapsed(id: string) {
    surfaceUI.update(ui => {
        const collapsed = ui.collapsedGroups.includes(id)
            ? ui.collapsedGroups.filter(g => g !== id)
            : [...ui.collapsedGroups, id];
        return { ...ui, collapsedGroups: collapsed };
    });
}

function getTopLevelSelected(selected: string[]): string[] {
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

    const topLevel = getTopLevelSelected(selected);

    const deletedIds = topLevel.flatMap(id => deleteSurfaceAndChildren(id));
    const deletedSurfaces = deletedIds.map(id => structuredClone(get(surfaceStore(id))));

    eventStore.push({
        category: "Surface",
        type: "Deleted",
        forwardData: { surfaceIds: [...topLevel] },
        backwardData: {
            deletedSurfaces,
        },
    });


    const deletedSet = new Set(deletedIds);
    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: [],
        collapsedGroups: ui.collapsedGroups.filter(id => !deletedSet.has(id)),
    }));

    selectionAnchor = null;
}

export function startMultiDragIfNeeded(draggedId: string) {
    const selected = get(surfaceUI).selectedSurfaces;
    if (selected.includes(draggedId) && selected.length > 1) {
        const topLevel = getTopLevelSelected(selected);
        if (!topLevel.includes(draggedId)) return;
        activeDragCompanions.set(new Set(selected.filter(id => id !== draggedId)));
    }
}

export function clearMultiDrag() {
    activeDragCompanions.set(new Set());
}

export function applyFinalize(
    zoneParent: string | null,
    newItems: SurfaceDisplayTreeItem[],
    trigger: TRIGGERS,
    draggedId: string,
) {
    const selected = get(surfaceUI).selectedSurfaces;
    const topLevel = getTopLevelSelected(selected);

    const isMultiDrag = selected.includes(draggedId) && selected.length > 1
        && topLevel.includes(draggedId);
    const topLevelCompanionIds = isMultiDrag
        ? topLevel.filter(id => id !== draggedId)
        : [];

    if (trigger === TRIGGERS.DROPPED_INTO_ANOTHER) {
        let ids = newItems.map(i => i.id);
        if (isMultiDrag) {
            ids = ids.filter(id => !topLevelCompanionIds.includes(id));
        }
        updateZone(zoneParent, ids);
        return;
    }

    if (!isMultiDrag) {
        updateZone(zoneParent, newItems.map(i => i.id));
        return;
    }

    let targetIds = newItems.map(i => i.id);
    targetIds = targetIds.filter(id => !topLevelCompanionIds.includes(id));

    const draggedIdx = targetIds.indexOf(draggedId);
    if (draggedIdx >= 0) {
        targetIds.splice(draggedIdx + 1, 0, ...topLevelCompanionIds);
    }

    const newParentId = zoneParent ?? "root";

    
    for (const id of topLevel) {
        const surface = get(surfaceStore(id));
        if (!surface) continue;

        if (surface.parentId !== "root") {
            surfaceStore(surface.parentId).update(s => {
                if (s.type === "Group") {
                    return {
                        ...s,
                        children: s.children.filter(cid => cid !== id)
                    };
                }
                return s;
            });
        }
        else {
            rootSurfaces.update(r => ({
                ...r,
                children: r.children.filter(cid => cid !== id)
            }));
        }

        surface.parentId = newParentId;
    }

    if (zoneParent) {
        surfaceStore(zoneParent).update(s => {
            if (s.type === "Group") {
                return {
                    ...s,
                    children: targetIds
                };
            }
            return s;
        });
    }
}

function updateZone(zoneParent: string | null, ids: string[]) {
    for (const id of ids) {
        surfaceStore(id).update(s => ({
            ...s,
            parentId: zoneParent ?? "root"
        }));
    }

    if (zoneParent) {
        surfaceStore(zoneParent).update(s => {
            if (s.type === "Group") {
                return {
                    ...s,
                    children: ids
                };
            }
            return s;
        });
    }
    else {
        rootSurfaces.update(r => ({
            ...r,
            children: ids
        }));
    }
}
