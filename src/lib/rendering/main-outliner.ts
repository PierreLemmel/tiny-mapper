import * as THREE from "three";

type OutlineListener = (objects: THREE.Object3D[]) => void

export class MainOutliner {

    private listeners: OutlineListener[] = [];
    private _outlinedObjects = new Set<THREE.Object3D>();

    public get outlinedObjects(): THREE.Object3D[] {
        return [...this._outlinedObjects]
    }

    public addListener(listener: OutlineListener): void {
        this.listeners.push(listener);
    }

    public add(...objects: THREE.Object3D[]): void {
        const selected = this._outlinedObjects;
        let changed = false;
        for (const obj of objects) {
            if (!selected.has(obj)) {
                selected.add(obj);
                changed = true;
            }
        }
        if (changed) {
            this.dispatchOutlinedObjectsChanged();
        }
    }

    public clear(): void {
        if (this._outlinedObjects.size > 0) {
            this._outlinedObjects.clear();
            this.dispatchOutlinedObjectsChanged();
        }
    }

    public set(...objects: THREE.Object3D[]): void {
        this._outlinedObjects.clear();
        this.add(...objects)
    }

    private dispatchOutlinedObjectsChanged(): void {
        const data = this.outlinedObjects;
        this.listeners.forEach(listener => listener(data));
    }
}
