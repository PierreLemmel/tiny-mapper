import * as THREE from "three";
import type { MainScene } from "./main-scene";
import type { Position } from "../logic/mapping";
import { get } from "svelte/store";
import { mainRendering } from "../stores/rendering";

let cameraCount = 0;

const CAMERA_Z_POSITION = 5;

export class MainCamera {
    private _camera: THREE.OrthographicCamera;

    public get camera(): THREE.OrthographicCamera {
        return this._camera;
    }

    public get cameraCount(): number {
        return cameraCount;
    }

    private _position: Position;
    private _zoom: number;

    public constructor(width: number, height: number) {

        const { position, zoom } = get(mainRendering);

        this._position = position;
        this._zoom = zoom;

        const [x, y] = position;

        this._camera = new THREE.OrthographicCamera(x - width / 2, x + width / 2, y + height / 2, y - height / 2, 0.1, 1000);
        this._camera.position.set(x, y, CAMERA_Z_POSITION);

        cameraCount++;
    }

    private updateCamera(width: number, height: number) {
        this._camera.left = this._position[0] - width / 2;
        this._camera.right = this._position[0] + width / 2;
        this._camera.top = this._position[1] + height / 2;
        this._camera.bottom = this._position[1] - height / 2;

        this._camera.updateProjectionMatrix();
    }

    public resize(width: number, height: number) {
        this.updateCamera(width, height);
    }

    public dispose() {
        cameraCount--;
    }
}