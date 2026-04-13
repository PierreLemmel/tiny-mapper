import { get, writable } from "svelte/store";
import { TRIGGERS } from "svelte-dnd-action";

import { eventStore } from "../../../lib/events/event-store";
import {
    captureMaterialTreeSnapshot,
    materialTreeSnapshotsEqual,
} from "../../../lib/logic/materials/material-tree-snapshot";
import { materialUI } from "../../../lib/stores/user-interface";
import { rootMaterials, materialStore } from "../../../lib/stores/materials";
import { DEFAULT_MATERIAL_ID, deleteMaterialAndChildren } from "../../../lib/logic/materials/materials";
import { tick } from "svelte";
import type { MaterialDeleted } from "../../../lib/events/materials/materials-event-types";

export type MaterialDisplayTreeItem = {
    id: string;
    isDndShadowItem?: boolean;
}

export const activeDragCompanions = writable<Set<string>>(new Set());
export const renameRequestId = writable<string | null>(null);

let selectionAnchor: string | null = null;

function getFlatVisualOrder(): string[] {
    const collapsed = new Set(get(materialUI).collapsedGroups);
    const result: string[] = [];

    function walk(id: string) {
        result.push(id);
        const store = materialStore(id);
        const material = get(store);
        if (material && material.type === "Group" && !collapsed.has(id)) {
            for (const childId of material.children) {
                walk(childId);
            }
        }
    }

    const root = get(rootMaterials);
    for (const id of root.children) {
        walk(id);
    }

    return result;
}

export type SelectMaterialModifiers = {
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

export function selectMaterial(id: string, modifiers: SelectMaterialModifiers) {
    const isCtrl = modifiers.ctrlKey || modifiers.metaKey;

    if (modifiers.shiftKey && selectionAnchor) {
        const flatOrder = getFlatVisualOrder();
        const anchorIdx = flatOrder.indexOf(selectionAnchor);
        const clickedIdx = flatOrder.indexOf(id);

        if (anchorIdx >= 0 && clickedIdx >= 0) {
            const start = Math.min(anchorIdx, clickedIdx);
            const end = Math.max(anchorIdx, clickedIdx);
            const rangeIds = flatOrder.slice(start, end + 1);

            materialUI.update(ui => ({
                ...ui,
                selectedMaterials: rangeIds,
            }));
        }
        return;
    }

    if (isCtrl) {
        materialUI.update(ui => ({
            ...ui,
            selectedMaterials: ui.selectedMaterials.includes(id)
                ? ui.selectedMaterials.filter(m => m !== id)
                : [...ui.selectedMaterials, id],
        }));
        selectionAnchor = id;
        return;
    }

    const current = get(materialUI).selectedMaterials;
    if (current.length === 1 && current[0] === id) {
        clearSelection();
        return;
    }

    materialUI.update(ui => ({
        ...ui,
        selectedMaterials: [id],
    }));
    selectionAnchor = id;
}

export function clearSelection() {
    materialUI.update(ui => ({
        ...ui,
        selectedMaterials: [],
    }));
    selectionAnchor = null;
}

export function toggleGroupCollapsed(id: string) {
    materialUI.update(ui => {
        const collapsed = ui.collapsedGroups.includes(id)
            ? ui.collapsedGroups.filter(g => g !== id)
            : [...ui.collapsedGroups, id];
        return { ...ui, collapsedGroups: collapsed };
    });
}

function getTopLevelSelected(selected: string[]): string[] {
    const selectedSet = new Set(selected);
    return selected.filter(id => {
        let parentId = get(materialStore(id)).parentId;
        while (parentId && parentId !== "root") {
            if (selectedSet.has(parentId)) return false;
            parentId = get(materialStore(parentId)).parentId;
        }
        return true;
    });
}

export function deleteSelectedMaterials() {
    const selected = get(materialUI).selectedMaterials;
    if (selected.length === 0) return;

       const topLevel = getTopLevelSelected(selected).filter(id => id !== DEFAULT_MATERIAL_ID);

    if (topLevel.length === 0) {
        return;
    }

    const deletedMaterials = topLevel.flatMap(id => deleteMaterialAndChildren(id));

    eventStore.push<MaterialDeleted>({
        category: "Material",
        type: "Deleted",
        forwardData: { materialIds: [...topLevel] },
        backwardData: {
            deletedMaterials,
        },
    });

    const deletedSet = new Set(deletedMaterials.map(m => m.material.id));
    materialUI.update(ui => ({
        ...ui,
        selectedMaterials: [],
        collapsedGroups: ui.collapsedGroups.filter(id => !deletedSet.has(id)),
    }));

    selectionAnchor = null;
}

export function startMultiDragIfNeeded(draggedId: string) {
    const selected = get(materialUI).selectedMaterials;
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
    newItems: MaterialDisplayTreeItem[],
    trigger: TRIGGERS,
    draggedId: string,
) {
    triggerTreeMovedEventDebounced();

    const selected = get(materialUI).selectedMaterials;
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
        const material = get(materialStore(id));
        if (!material) continue;

        if (material.parentId !== "root") {
            materialStore(material.parentId).update(m => {
                if (m.type === "Group") {
                    return {
                        ...m,
                        children: m.children.filter(cid => cid !== id)
                    };
                }
                return m;
            });
        }
        else {
            rootMaterials.update(r => ({
                ...r,
                children: r.children.filter(cid => cid !== id)
            }));
        }

        materialStore(id).update(m => ({
            ...m,
            parentId: newParentId
        }));
    }

    if (zoneParent) {
        materialStore(zoneParent).update(m => {
            if (m.type === "Group") {
                return {
                    ...m,
                    children: targetIds
                };
            }
            return m;
        });
    }
    else {
        rootMaterials.update(r => ({
            ...r,
            children: targetIds
        }));
    }
}

function updateZone(zoneParent: string | null, ids: string[]) {
    for (const id of ids) {
        materialStore(id).update(m => ({
            ...m,
            parentId: zoneParent ?? "root"
        }));
    }

    if (zoneParent) {
        materialStore(zoneParent).update(m => {
            if (m.type === "Group") {
                return {
                    ...m,
                    children: ids
                };
            }
            return m;
        });
    }
    else {
        rootMaterials.update(r => ({
            ...r,
            children: ids
        }));
    }
}

let isSnapshotPending = false;
export async function triggerTreeMovedEventDebounced() {
    if (isSnapshotPending) {
        return;
    }
    isSnapshotPending = true;
    const before = captureMaterialTreeSnapshot();
    await tick();
    const after = captureMaterialTreeSnapshot();
    isSnapshotPending = false;

    if (!materialTreeSnapshotsEqual(before, after)) {
        eventStore.push({
            category: "Material",
            type: "TreeMoved",
            forwardData: after,
            backwardData: before,
        });
    }
}
