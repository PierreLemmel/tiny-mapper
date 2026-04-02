import { get } from "svelte/store";

import { rootMaterials, materialStore, getAllMaterials } from "../../stores/materials";

export type MaterialTreeSnapshot = {
    rootChildren: string[];
    groupChildren: Record<string, string[]>;
};

export function captureMaterialTreeSnapshot(): MaterialTreeSnapshot {
    const root = get(rootMaterials);
    const groupChildren: Record<string, string[]> = {};
    for (const m of getAllMaterials()) {
        if (m.type === "Group") {
            groupChildren[m.id] = [...m.children];
        }
    }
    return { rootChildren: [...root.children], groupChildren };
}

export function applyMaterialTreeSnapshot(snapshot: MaterialTreeSnapshot): void {
    rootMaterials.update(r => ({ ...r, children: [...snapshot.rootChildren] }));
    for (const [groupId, children] of Object.entries(snapshot.groupChildren)) {
        materialStore(groupId).update(m => {
            if (m.type === "Group") return { ...m, children: [...children] };
            return m;
        });
    }
    function assignParent(id: string, parentId: string) {
        materialStore(id).update(m => ({ ...m, parentId: parentId as typeof m.parentId }));
        const m = get(materialStore(id));
        if (m.type === "Group") {
            for (const cid of m.children) {
                assignParent(cid, id);
            }
        }
    }
    for (const id of snapshot.rootChildren) {
        assignParent(id, "root");
    }
}

export function materialTreeSnapshotsEqual(a: MaterialTreeSnapshot, b: MaterialTreeSnapshot): boolean {
    if (a.rootChildren.length !== b.rootChildren.length) return false;
    if (a.rootChildren.some((id, i) => id !== b.rootChildren[i])) return false;
    const keysA = Object.keys(a.groupChildren).sort();
    const keysB = Object.keys(b.groupChildren).sort();
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
        const ca = a.groupChildren[k];
        const cb = b.groupChildren[k];
        if (!cb || ca.length !== cb.length) return false;
        if (ca.some((id, i) => id !== cb[i])) return false;
    }
    return true;
}
