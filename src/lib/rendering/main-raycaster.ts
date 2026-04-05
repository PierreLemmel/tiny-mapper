import * as THREE from "three";
import type { MainCamera } from "./main-camera";
import type { MainScene } from "./main-scene";
import { RenderingLayers } from "./rendering-layers";
import type { SurfaceType } from "../logic/surfaces/surfaces";
import { get } from "svelte/store";
import { surfaceStore } from "../stores/surfaces";

export type RaycastResult = {
    type: "Nothing";
} | {
    type: "Surface";
    surfaceId: string;
    surfaceType: SurfaceType;
}

export class MainRaycaster {
    private raycaster: THREE.Raycaster;
    
    private _camera: MainCamera;
    private _scene: MainScene;

    public constructor(camera: MainCamera, scene: MainScene) {
        this._camera = camera;
        this._scene = scene;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.set(RenderingLayers.SURFACES);
    }

    public castRay(ndcX: number, ndcY: number): RaycastResult {

        this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this._camera.camera);

        const intersects = this.raycaster.intersectObjects(this._scene.content.children);

        if (intersects.length === 0) {
            return { type: "Nothing" };
        }

        const {
            object,
            face
        } = intersects[0];

        const surfaceId = object.userData.id;
        const surfaceType = object.userData.type as SurfaceType;
        
        if (face) {
            const {
                a,
                b,
                c,
            } = face;

            const surface = get(surfaceStore(surfaceId));
            if (surface.type !== "Quad") {
                console.warn(`Raycast hit a non-quad surface '${surfaceId}' (type: ${surface.type})`);
                return { type: "Nothing" };
            }

            const meshGeometry = (object as THREE.Mesh).geometry;
            console.log(meshGeometry);
            const worldCoords = [a, b, c].map(idx => idx);
            console.log(worldCoords);
        }


        return {
            type: "Surface",
            surfaceId,
            surfaceType,
        };
    }
}
