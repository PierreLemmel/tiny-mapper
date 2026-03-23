import { get, writable } from "svelte/store";
import { TRIGGERS } from "svelte-dnd-action";
import { content } from "../../lib/stores/content";
import { surfaceUI } from "../../lib/stores/user-interface";
import type { PointerModifiers } from "../../lib/ui/longpress-action";

export type SurfaceDisplayTreeItem = {
    id: string;
    isDndShadowItem?: boolean;
}

export const activeDragCompanions = writable<Set<string>>(new Set());
export const renameRequestId = writable<string | null>(null);

let selectionAnchor: string | null = null;

function getFlatVisualOrder(): string[] {
    const c = get(content);
    const collapsed = new Set(get(surfaceUI).collapsedGroups);
    const result: string[] = [];

    function walk(id: string) {
        result.push(id);
        const surface = c.surfaces[id];
        if (surface && surface.type === "Group" && !collapsed.has(id)) {
            for (const childId of surface.children) {
                walk(childId);
            }
        }
    }

    for (const id of c.rootSurfaces) {
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

function getParentMap(): Map<string, string | null> {
    const c = get(content);
    const parentMap = new Map<string, string | null>();

    for (const id of c.rootSurfaces) {
        parentMap.set(id, null);
    }

    for (const surface of Object.values(c.surfaces)) {
        if (surface.type === "Group") {
            for (const childId of surface.children) {
                parentMap.set(childId, surface.id);
            }
        }
    }

    return parentMap;
}

function getTopLevelSelected(selected: string[]): string[] {
    const selectedSet = new Set(selected);
    const parentMap = getParentMap();

    return selected.filter(id => {
        let current = parentMap.get(id) ?? undefined;
        while (current !== undefined) {
            if (selectedSet.has(current)) return false;
            current = parentMap.get(current) ?? undefined;
        }
        return true;
    });
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

    const topLevelSet = new Set(topLevel);
    content.update(c => {
        const newContent = structuredClone(c);

        newContent.rootSurfaces = newContent.rootSurfaces.filter(
            id => !topLevelSet.has(id)
        );
        for (const surface of Object.values(newContent.surfaces)) {
            if (surface.type === "Group") {
                surface.children = surface.children.filter(
                    id => !topLevelSet.has(id)
                );
            }
        }

        if (zoneParent === null) {
            newContent.rootSurfaces = targetIds;
        } else {
            const group = newContent.surfaces[zoneParent];
            if (group && group.type === "Group") {
                group.children = targetIds;
            }
        }

        return newContent;
    });
}

function updateZone(zoneParent: string | null, ids: string[]) {
    if (zoneParent === null) {
        content.update(c => ({ ...c, rootSurfaces: ids }));
    } else {
        content.update(c => {
            const group = c.surfaces[zoneParent];
            if (!group || group.type !== "Group") return c;
            return {
                ...c,
                surfaces: {
                    ...c.surfaces,
                    [zoneParent]: { ...group, children: ids }
                }
            };
        });
    }
}
