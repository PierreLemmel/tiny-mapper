import { get } from "svelte/store";

import { rootSurfaces, surfaceStore, getAllSurfaces } from "../../stores/surfaces";

export type SurfaceTreeSnapshot = {
    rootChildren: string[];
    groupChildren: Record<string, string[]>;
};


export function surfaceTreeSnapshot(): SurfaceTreeSnapshot {
    const root = get(rootSurfaces);
    const groupChildren: Record<string, string[]> = {};
    for (const s of getAllSurfaces()) {
        if (s.type === "Group") {
            groupChildren[s.id] = [...s.children];
        }
    }
    return { rootChildren: [...root.children], groupChildren };
}

export function applySurfaceTreeSnapshot(snapshot: SurfaceTreeSnapshot): void {
    
    rootSurfaces.update(r => ({ ...r, children: [...snapshot.rootChildren] }));
    for (const [groupId, children] of Object.entries(snapshot.groupChildren)) {
        surfaceStore(groupId).update(s => {
            if (s.type === "Group") return { ...s, children: [...children] };
            return s;
        });
    }
    function assignParent(id: string, parentId: string) {
        surfaceStore(id).update(s => ({ ...s, parentId: parentId as typeof s.parentId }));
        const s = get(surfaceStore(id));
        if (s.type === "Group") {
            for (const cid of s.children) {
                assignParent(cid, id);
            }
        }
    }
    for (const id of snapshot.rootChildren) {
        assignParent(id, "root");
    }
}

export function surfaceTreeSnapshotsEqual(a: SurfaceTreeSnapshot, b: SurfaceTreeSnapshot): boolean {
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
