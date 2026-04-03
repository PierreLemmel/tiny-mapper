import { get, writable } from "svelte/store";
import { TRIGGERS } from "svelte-dnd-action";

import { eventStore } from "../../../lib/events/event-store";
import {
    surfaceTreeSnapshot,
    surfaceTreeSnapshotsEqual,
} from "../../../lib/logic/surfaces/surface-tree-snapshot";
import { surfaceUI } from "../../../lib/stores/user-interface";
import { rootSurfaces, surfaceStore } from "../../../lib/stores/surfaces";
import { deleteSurfaceAndChildren } from "../../../lib/logic/surfaces/surfaces";
import { tick } from "svelte";
import type { SurfaceDeleted } from "../../../lib/events/surfaces/surfaces-event-types";
import { getTopLevelSelectedSurfaces } from "../../../lib/logic/surfaces/surface-selection";


export type SurfaceDisplayTreeItem = {
    id: string;
    isDndShadowItem?: boolean;
}

export const activeDragCompanions = writable<Set<string>>(new Set());
export const renameRequestId = writable<string | null>(null);



export function toggleGroupCollapsed(id: string) {
    surfaceUI.update(ui => {
        const collapsed = ui.collapsedGroups.includes(id)
            ? ui.collapsedGroups.filter(g => g !== id)
            : [...ui.collapsedGroups, id];
        return { ...ui, collapsedGroups: collapsed };
    });
}



export function startMultiDragIfNeeded(draggedId: string) {
    const selected = get(surfaceUI).selectedSurfaces;
    if (selected.includes(draggedId) && selected.length > 1) {
        const topLevel = getTopLevelSelectedSurfaces(selected);
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
    triggerTreeMovedEventDebounced();

    const selected = get(surfaceUI).selectedSurfaces;
    const topLevel = getTopLevelSelectedSurfaces(selected);

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

        surfaceStore(id).update(s => ({
            ...s,
            parentId: newParentId
        }));
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
    else {
        rootSurfaces.update(r => ({
            ...r,
            children: targetIds
        }));
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

let isSnapshotPending = false;
export async function triggerTreeMovedEventDebounced() {
    if (isSnapshotPending){
        return;
    }
    isSnapshotPending = true;
    const before = surfaceTreeSnapshot();
    await tick();
    const after = surfaceTreeSnapshot();
    isSnapshotPending = false;

    if (!surfaceTreeSnapshotsEqual(before, after)) {
        eventStore.push({
            category: "Surface",
            type: "TreeMoved",
            forwardData: after,
            backwardData: before,
        });
    }
}