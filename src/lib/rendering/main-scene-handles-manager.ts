import * as THREE from "three";
import { get } from "svelte/store";
import { surfaceUI } from "../stores/user-interface";
import { uiSettings } from "../stores/settings";
import type { MainSceneHandlePickEntry, QuadSurfaceRenderData } from "./main-scene-types";
import { RenderingLayers } from "./rendering-layers";
import { CAMERA_Z_POSITION } from "./main-camera";

const HANDLES_Z_POSITION = CAMERA_Z_POSITION - 0.5;

export class MainSceneHandlesManager {
    private scene: THREE.Scene;
    private quadSurfaceMap: Map<string, QuadSurfaceRenderData>;

    private handlesGroup: THREE.Group = new THREE.Group();
    private handlesMaterial: THREE.PointsMaterial = new THREE.PointsMaterial();
    private handlesTexture: THREE.Texture | null = null;
    private handlesPoints: THREE.Points | null = null;

    private unsubscribes: (() => void)[] = [];

    public constructor(scene: THREE.Scene, quadSurfaceMap: Map<string, QuadSurfaceRenderData>) {
        this.scene = scene;
        this.quadSurfaceMap = quadSurfaceMap;
    }

    public initialize() {
        this.handlesGroup.name = "handlesGroup";
        this.scene.add(this.handlesGroup);

        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d")!;
        ctx.beginPath();
        ctx.arc(16, 16, 14, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        this.handlesTexture = new THREE.CanvasTexture(canvas);

        const settings = get(uiSettings);
        this.handlesMaterial = new THREE.PointsMaterial({
            size: settings.handlesSize,
            map: this.handlesTexture,
            sizeAttenuation: false,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            alphaTest: 0.5,
            vertexColors: true,
        });

        this.unsubscribes.push(
            uiSettings.subscribe(s => {
                this.handlesMaterial.size = s.handlesSize;
                this.updateHandles();
            })
        );
    }

    public updateHandles() {
        if (this.handlesPoints) {
            this.handlesGroup.remove(this.handlesPoints);
            this.handlesPoints.geometry.dispose();
            this.handlesPoints = null;
        }

        const ui = get(surfaceUI);
        const settings = get(uiSettings);

        const positions: number[] = [];
        const colors: number[] = [];
        const handlePick: MainSceneHandlePickEntry[] = [];

        const sel = settings.handlesSelectedColor;
        const unsel = settings.handlesUnselectedColor;

        for (const surfaceId of ui.selectedSurfaces) {
            const renderData = this.quadSurfaceMap.get(surfaceId);
            if (!renderData) continue;

            const { mesh } = renderData;
            mesh.updateWorldMatrix(true, false);

            const posAttr = mesh.geometry.getAttribute("position");
            const selectedHandles = new Set(ui.selectedHandles[surfaceId] ?? []);

            for (let i = 0; i < posAttr.count; i++) {
                const worldPos = mesh.localToWorld(new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), 0));
                worldPos.z = HANDLES_Z_POSITION;

                positions.push(worldPos.x, worldPos.y, worldPos.z);
                handlePick.push({ surfaceId, vertexIndex: i });

                if (selectedHandles.has(i)) {
                    colors.push(sel[0], sel[1], sel[2]);
                } else {
                    colors.push(unsel[0], unsel[1], unsel[2]);
                }
            }
        }

        if (positions.length === 0) return;

        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

        this.handlesPoints = new THREE.Points(geom, this.handlesMaterial);
        this.handlesPoints.userData.handlePick = handlePick;
        this.handlesPoints.renderOrder = 1001;
        this.handlesPoints.layers.set(RenderingLayers.HANDLES);
        this.handlesGroup.add(this.handlesPoints);
    }

    public dispose() {
        for (const unsubscribe of this.unsubscribes) {
            unsubscribe();
        }
        this.unsubscribes.length = 0;

        if (this.handlesPoints) {
            this.handlesPoints.geometry.dispose();
            this.handlesPoints = null;
        }
        this.handlesMaterial.dispose();
        this.handlesTexture?.dispose();
    }
}
