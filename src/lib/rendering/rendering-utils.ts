import * as THREE from "three";

export function disposeChildrenGeometries(children: THREE.Object3D[]) {
    for (const child of children) {
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
        }
        else if (child instanceof THREE.Group) {
            disposeChildrenGeometries(child.children);
        }
    }
}