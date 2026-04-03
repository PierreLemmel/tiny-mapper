import * as THREE from "three";
import type { MainCamera } from "./main-camera";
import type { MainScene } from "./main-scene";
import { RenderingLayers } from "./rendering-layers";
import type { SurfaceType } from "../logic/surfaces/surfaces";

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

        const intersect = intersects[0];
        return {
            type: "Surface",
            surfaceId: intersect.object.userData.id,
            surfaceType: intersect.object.userData.type as SurfaceType
        };
    }
}
