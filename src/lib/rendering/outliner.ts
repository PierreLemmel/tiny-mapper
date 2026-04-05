import * as THREE from "three";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { RenderingLayers } from "./rendering-layers";
import { Line2, LineGeometry } from "three/examples/jsm/Addons.js";
import { disposeChildrenGeometries } from "./rendering-utils";

export function addOutlinerToObject(object: THREE.Mesh, backgroundMaterial: THREE.MeshBasicMaterial, outlineMaterial: LineMaterial) {

    
    const group = new THREE.Group();
    group.name = "Outline Group";

    const background = new THREE.Mesh(object.geometry, backgroundMaterial);
    background.name = "Outline Background";
    background.layers.set(RenderingLayers.SELECTION_BOX);
    background.renderOrder = 998;
    group.add(background);

    const outlineGeometry = new LineGeometry();
    outlineGeometry.setPositions(new Float32Array(object.geometry.attributes.position.array));
    const outline = new Line2(outlineGeometry, outlineMaterial);
    outline.name = "Outline Outline";
    outline.layers.set(RenderingLayers.SELECTION_BOX);
    outline.renderOrder = 999;
    group.add(outline);

    object.add(group);
}

export function removeOutlinerFromObject(object: THREE.Mesh) {

    const children = object.children;
    disposeChildrenGeometries(children);
    object.clear()
}

export function hasOutliner(object: THREE.Mesh) {

}