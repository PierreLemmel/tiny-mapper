import * as THREE from "three";
import { get } from "svelte/store";
import { surfaceStore } from "../stores/surfaces";
import { surfaceUI } from "../stores/user-interface";
import { uiSettings } from "../stores/settings";
import { log } from "../logging/logger";
import { RenderingLayers } from "./rendering-layers";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { MainOutliner } from "./main-outliner";
import type { GroupSurfaceRenderData, QuadSurfaceRenderData } from "./main-scene-types";
import { CAMERA_Z_POSITION } from "./main-camera";

const SELECTION_Z_POSITION = CAMERA_Z_POSITION - 1;
const SELECTION_BOX_WIDTH = 3;

export class MainSceneSelectionManager {
    private scene: THREE.Scene;
    private quadSurfaceMap: Map<string, QuadSurfaceRenderData>;
    private groupSurfaceMap: Map<string, GroupSurfaceRenderData>;
    private outliner: MainOutliner;

    private selectionBox: THREE.Group = new THREE.Group();
    private singleSelectedObject: THREE.Object3D | null = null;
    private selectionOverlayMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial();
    private selectionOutlineMaterial: LineMaterial = new LineMaterial();

    private unsubscribes: (() => void)[] = [];

    public constructor(
        scene: THREE.Scene,
        quadSurfaceMap: Map<string, QuadSurfaceRenderData>,
        groupSurfaceMap: Map<string, GroupSurfaceRenderData>,
        outliner: MainOutliner
    ) {
        this.scene = scene;
        this.quadSurfaceMap = quadSurfaceMap;
        this.groupSurfaceMap = groupSurfaceMap;
        this.outliner = outliner;
    }

    public initialize() {
        this.selectionBox.name = "selectionBox";
        this.selectionBox.userData.id = "selectionBox";
        this.scene.add(this.selectionBox);

        const selectionGeometry = new THREE.PlaneGeometry(1, 1);
        this.selectionOverlayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: get(uiSettings).selectionOverlayOpacity,
            depthTest: false,
        });
        const selectionBackground = new THREE.Mesh(selectionGeometry, this.selectionOverlayMaterial);
        selectionBackground.name = "Selection Background";

        const outlineGeometry = new LineGeometry();
        outlineGeometry.setPositions([
            -0.5, -0.5, 0,
            0.5, -0.5, 0,
            0.5, 0.5, 0,
            -0.5, 0.5, 0,
            -0.5, -0.5, 0,
        ]);

        this.selectionOutlineMaterial = new LineMaterial({
            color: 0xfffff,
            linewidth: SELECTION_BOX_WIDTH,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
            depthWrite: false,
            depthTest: false,
            transparent: true,
        });

        const selectionOutline = new Line2(outlineGeometry, this.selectionOutlineMaterial);
        selectionOutline.name = "Selection Outline";

        this.selectionBox.add(selectionBackground);
        this.selectionBox.add(selectionOutline);

        this.selectionBox.layers.set(RenderingLayers.SELECTION_BOX);
        selectionBackground.layers.set(RenderingLayers.SELECTION_BOX);
        selectionOutline.layers.set(RenderingLayers.SELECTION_BOX);

        this.selectionBox.renderOrder = 999;
        selectionBackground.renderOrder = 998;
        selectionOutline.renderOrder = 999;

        this.unsubscribes.push(
            uiSettings.subscribe(settings => {
                this.selectionOverlayMaterial.opacity = settings.selectionOverlayOpacity;
                this.selectionOverlayMaterial.color.set(
                    settings.selectionColor[0],
                    settings.selectionColor[1],
                    settings.selectionColor[2]
                );
                this.selectionOutlineMaterial.color.set(
                    settings.selectionColor[0],
                    settings.selectionColor[1],
                    settings.selectionColor[2]
                );
            })
        );
    }

    public updateSelectionItems() {
        const selectedIds = get(surfaceUI).selectedSurfaces;

        this.selectionBox.visible = false;

        if (selectedIds.length > 1) {
            this.outliner.clear();
            this.updateSelectionBoxForManyItems(selectedIds);
            this.clearOldSelectionOverlay();
        } else if (selectedIds.length === 1) {
            const selectedId = selectedIds[0];

            const surface = get(surfaceStore(selectedId));

            if (surface.type === "Group") {
                this.outliner.clear();
                this.updateSelectionBoxForManyItems(selectedIds);
                this.clearOldSelectionOverlay();
            } else {
                this.updateSelectionForSingleItem(selectedIds[0]);
            }
        } else {
            this.outliner.clear();
            this.clearOldSelectionOverlay();
        }
    }

    private updateSelectionBoxForManyItems(selectedIds: string[]) {
        this.selectionBox.visible = true;

        let box = new THREE.Box3();
        for (const id of selectedIds) {
            const object = this.quadSurfaceMap.get(id)?.mesh ?? this.groupSurfaceMap.get(id)?.group;
            if (!object) continue;

            const boundingBox = new THREE.Box3();
            boundingBox.setFromObject(object);
            box = box.union(boundingBox);
        }

        const center = new THREE.Vector3();
        box.getCenter(center);

        const { x, y } = center;

        const size = new THREE.Vector3();
        box.getSize(size);

        const { x: width, y: height } = size;

        this.selectionBox.position.set(x, y, SELECTION_Z_POSITION);
        this.selectionBox.scale.set(width + SELECTION_BOX_WIDTH / 2 - 1, height + SELECTION_BOX_WIDTH / 2 - 1, 1);
    }

    private updateSelectionForSingleItem(surfaceId: string) {
        const obj = this.quadSurfaceMap.get(surfaceId)?.mesh;

        if (this.singleSelectedObject?.userData.id === `${surfaceId}-overlay`) {
            return;
        }

        if (!obj) {
            log.error(`Object not found for surface '${surfaceId}'`);
            return;
        }

        this.clearOldSelectionOverlay();

        const overlayMesh = new THREE.Mesh(obj.geometry, this.selectionOverlayMaterial);
        overlayMesh.name = "Selection Overlay";
        overlayMesh.userData.id = `${surfaceId}-overlay`;
        overlayMesh.layers.enable(RenderingLayers.SELECTION_BOX);
        overlayMesh.renderOrder = 999;

        obj.add(overlayMesh);

        this.outliner.set(obj);
        this.singleSelectedObject = overlayMesh;
    }

    private clearOldSelectionOverlay() {
        if (this.singleSelectedObject) {
            this.singleSelectedObject.removeFromParent();
            this.singleSelectedObject.clear();
            this.singleSelectedObject = null;
        }
    }

    public dispose() {
        for (const unsubscribe of this.unsubscribes) {
            unsubscribe();
        }
        this.unsubscribes.length = 0;
    }
}
