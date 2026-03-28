import { get, writable } from "svelte/store";
import { TRIGGERS } from "svelte-dnd-action";
import {
    surfaces as surfacesData,
    rootSurfaces as rootSurfacesData
} from "../../../lib/stores/content";
import { eventStore } from "../../../lib/events/event-store";
import { surfaceUI } from "../../../lib/stores/user-interface";
import type { PointerModifiers } from "../../../lib/ui/longpress-action";

function snapshotTreeStructure() {
    const surfaces = get(surfacesData)
    const rootSurfaces = get(rootSurfacesData)
    const groupChildren: Record<string, string[]> = {};
    for (const surface of Object.values(surfaces)) {
        if (surface.type === "Group") {
            groupChildren[surface.id] = [...surface.children];
        }
    }
    return { rootSurfaces: [...rootSurfaces], groupChildren };
}

export type SurfaceDisplayTreeItem = {
    id: string;
    isDndShadowItem?: boolean;
}

export const activeDragCompanions = writable<Set<string>>(new Set());
export const renameRequestId = writable<string | null>(null);

let selectionAnchor: string | null = null;

function getFlatVisualOrder(): string[] {
    const surfaces = get(surfacesData)
    const rootSurfaces = get(rootSurfacesData)
    const collapsed = new Set(get(surfaceUI).collapsedGroups);
    const result: string[] = [];

    function walk(id: string) {
        result.push(id);
        const surface = surfaces[id];
        if (surface && surface.type === "Group" && !collapsed.has(id)) {
            for (const childId of surface.children) {
                walk(childId);
            }
        }
    }

    for (const id of rootSurfaces) {
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
    const surfaces = get(surfacesData);

    return selected.filter(id => {
        let parentId = surfaces[id]?.parentId;
        while (parentId && parentId !== "root") {
            if (selectedSet.has(parentId)) return false;
            parentId = surfaces[parentId]?.parentId;
        }
        return true;
    });
}

export function deleteSelectedSurfaces() {
    const selected = get(surfaceUI).selectedSurfaces;
    if (selected.length === 0) return;

    const surfaces = get(surfacesData)
    const rootSurfaces = get(rootSurfacesData)
    const topLevel = getTopLevelSelected(selected);

    const toDelete = new Set<string>();

    function collectDescendants(id: string) {
        toDelete.add(id);
        const surface = surfaces[id];
        if (surface && surface.type === "Group") {
            for (const childId of surface.children) {
                collectDescendants(childId);
            }
        }
    }

    for (const id of topLevel) {
        collectDescendants(id);
    }

    const deletedSurfaces = [...toDelete].map(id => structuredClone(surfaces[id]));
    const prevRootSurfaces = [...rootSurfaces];

    const nextSurfaces = structuredClone(surfaces);
    let nextRootSurfaces = structuredClone(rootSurfaces);


    for (const id of topLevel) {
        const surface = nextSurfaces[id];
        if (!surface) continue;

        if (surface.parentId === "root") {
            nextRootSurfaces = nextRootSurfaces.filter(rid => rid !== id);
        } else {
            const parent = nextSurfaces[surface.parentId];
            if (parent && parent.type === "Group") {
                parent.children = parent.children.filter(cid => cid !== id);
            }
        }
    }

    for (const id of toDelete) {
        delete surfaces[id];
    }

    surfacesData.set(nextSurfaces);
    rootSurfacesData.set(nextRootSurfaces);

    eventStore.push({
        category: "Surface",
        type: "Deleted",
        forwardData: { surfaceIds: [...toDelete] },
        backwardData: {
            deletedSurfaces,
            rootSurfaces: prevRootSurfaces,
        },
    });

    surfaceUI.update(ui => ({
        ...ui,
        selectedSurfaces: [],
        collapsedGroups: ui.collapsedGroups.filter(id => !toDelete.has(id)),
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
    const surfaces = get(surfacesData)
    const rootSurfaces = get(rootSurfacesData)

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

    const before = snapshotTreeStructure();
    const newParentId = zoneParent ?? "root";

    const nextSurfaces = structuredClone(surfaces);
    let nextRootSurfaces = structuredClone(rootSurfaces);

    
    for (const id of topLevel) {
        const surface = nextSurfaces[id];
        if (!surface) continue;

        if (surface.parentId === "root") {
            nextRootSurfaces = nextRootSurfaces.filter(rid => rid !== id);
        } else {
            const parent = nextSurfaces[surface.parentId];
            if (parent && parent.type === "Group") {
                parent.children = parent.children.filter(cid => cid !== id);
            }
        }

        surface.parentId = newParentId;
    }

    if (zoneParent === null) {
        nextRootSurfaces = targetIds;
    } else {
        const group = nextSurfaces[zoneParent];
        if (group && group.type === "Group") {
            group.children = targetIds;
        }
    }


    surfacesData.set(nextSurfaces);
    rootSurfacesData.set(nextRootSurfaces);

    const after = snapshotTreeStructure();
    eventStore.push({
        category: "Surface",
        type: "Reordered",
        forwardData: after,
        backwardData: before,
    });
}

function updateZone(zoneParent: string | null, ids: string[]) {
    const before = snapshotTreeStructure();
    const newParentId = zoneParent ?? "root";

    const surfaces = get(surfacesData)
    const rootSurfaces = get(rootSurfacesData)

    const nextSurfaces = structuredClone(surfaces);
    let nextRootSurfaces = structuredClone(rootSurfaces);     

    for (const id of ids) {
        if (nextSurfaces[id]) {
            nextSurfaces[id] = { ...nextSurfaces[id], parentId: newParentId };
        }
    }

    if (zoneParent !== null) {
        const group = nextSurfaces[zoneParent];
        if (group?.type === "Group") {

            nextSurfaces[zoneParent] = { ...group, children: ids };
        }
    }
    else {
        nextRootSurfaces = ids;
    }

    surfacesData.set(nextSurfaces);
    rootSurfacesData.set(nextRootSurfaces);

    const after = snapshotTreeStructure();
    eventStore.push({
        category: "Surface",
        type: "Reordered",
        forwardData: after,
        backwardData: before,
    });
}
