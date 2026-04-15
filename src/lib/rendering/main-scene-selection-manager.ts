import * as THREE from "three";
import { get } from "svelte/store";
import { surfaceGeometryStore, surfaceStore } from "../stores/surfaces";
import { surfaceUI } from "../stores/user-interface";
import { uiSettings } from "../stores/settings";
import { log } from "../logging/logger";
import { RenderingLayers } from "./rendering-layers";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import type { GroupSurfaceRenderData, QuadSurfaceRenderData } from "./main-scene-types";
import { CAMERA_Z_POSITION } from "./main-camera";

const SELECTION_Z_POSITION = CAMERA_Z_POSITION - 1;
const SELECTION_BOX_WIDTH = 3;

export class MainSceneSelectionManager {
    private scene: THREE.Scene;
    private quadSurfaceMap: Map<string, QuadSurfaceRenderData>;
    private groupSurfaceMap: Map<string, GroupSurfaceRenderData>;

    private selectionBox: THREE.Group = new THREE.Group();
    private singleSelectedOverlayObject: THREE.Object3D | null = null;
    private singleSelectedOutlineObject: THREE.Object3D | null = null;
    private singleSelectedObjectGeometryCallbackUnsub: (() => void) | null = null;
    private selectionOverlayMaterial: THREE.MeshBasicMaterial;
    private selectionBoxMaterial: LineMaterial;
    private selectionOutlineMaterial: THREE.LineBasicMaterial;

    private unsubscribes: (() => void)[] = [];

    public constructor(
        scene: THREE.Scene,
        quadSurfaceMap: Map<string, QuadSurfaceRenderData>,
        groupSurfaceMap: Map<string, GroupSurfaceRenderData>
    ) {
        this.scene = scene;
        this.quadSurfaceMap = quadSurfaceMap;
        this.groupSurfaceMap = groupSurfaceMap;

        this.selectionOverlayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: get(uiSettings).selectionOverlayOpacity,
            depthTest: false,
        });

        this.selectionBoxMaterial = new LineMaterial({
            color: 0xffffff,
            linewidth: SELECTION_BOX_WIDTH,
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
            depthWrite: false,
            depthTest: false,
            transparent: true,
        });

        this.selectionOutlineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: SELECTION_BOX_WIDTH,
            depthWrite: false,
            depthTest: false,
            transparent: true,
        });
    }

    public initialize() {
        this.selectionBox.name = "selectionBox";
        this.selectionBox.userData.id = "selectionBox";
        this.scene.add(this.selectionBox);

        const selectionGeometry = new THREE.PlaneGeometry(1, 1);
        
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

        const selectionOutline = new Line2(outlineGeometry, this.selectionBoxMaterial);
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
                this.selectionBoxMaterial.color.set(
                    settings.selectionColor[0],
                    settings.selectionColor[1],
                    settings.selectionColor[2]
                );
                this.selectionOutlineMaterial.color.set(
                    settings.selectionColor[0],
                    settings.selectionColor[1],
                    settings.selectionColor[2]
                );
                this.selectionOutlineMaterial.linewidth = settings.selectionOutlineThickness;
                this.selectionBoxMaterial.linewidth = settings.selectionOutlineThickness;
            })
        );
    }

    public updateSelectionItems() {
        const selectedIds = get(surfaceUI).selectedSurfaces;

        this.selectionBox.visible = false;

        if (selectedIds.length > 1) {
            this.updateSelectionBoxForManyItems(selectedIds);
            this.clearOldSelectionOverlay();
        } else if (selectedIds.length === 1) {
            const selectedId = selectedIds[0];

            const surface = get(surfaceStore(selectedId));

            if (surface.type === "Group") {
                this.updateSelectionBoxForManyItems(selectedIds);
                this.clearOldSelectionOverlay();
            } else {
                this.updateSelectionForSingleItem(selectedIds[0]);
            }
        } else {
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

        if (this.singleSelectedOverlayObject?.userData.id === `${surfaceId}-overlay`) {
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
        overlayMesh.renderOrder = 998;

        const edgeGeometry = new THREE.EdgesGeometry(obj.geometry);
        const lines = new THREE.LineSegments(edgeGeometry, this.selectionOutlineMaterial);
        lines.name = "Selection Outline";
        lines.userData.id = `${surfaceId}-outline`;
        lines.layers.enable(RenderingLayers.SELECTION_BOX);
        lines.renderOrder = 997;

        obj.add(overlayMesh);
        obj.add(lines);

        this.singleSelectedObjectGeometryCallbackUnsub = surfaceGeometryStore(surfaceId).subscribe(g => {
            const oldGeometry = lines.geometry;
            const newGeometry = new THREE.EdgesGeometry(obj.geometry);
            lines.geometry = newGeometry;
            oldGeometry.dispose();
        });

        this.singleSelectedOverlayObject = overlayMesh;
        this.singleSelectedOutlineObject = lines;
    }

    private clearOldSelectionOverlay() {

        if (this.singleSelectedObjectGeometryCallbackUnsub) {
            this.singleSelectedObjectGeometryCallbackUnsub();
            this.singleSelectedObjectGeometryCallbackUnsub = null;
        }

        if (this.singleSelectedOverlayObject) {
            this.singleSelectedOverlayObject.removeFromParent();
            this.singleSelectedOverlayObject.clear();
            this.singleSelectedOverlayObject = null;
        }
        if (this.singleSelectedOutlineObject) {
            this.singleSelectedOutlineObject.removeFromParent();
            this.singleSelectedOutlineObject.clear();
            this.singleSelectedOutlineObject = null;
        }
    }

    public dispose() {
        for (const unsubscribe of this.unsubscribes) {
            unsubscribe();
        }
        this.unsubscribes.length = 0;
    }
}
