import * as THREE from "three";
import type { Position } from "../logic/mapping";
import { get } from "svelte/store";
import { mainRendering } from "../stores/rendering";
import { RenderingLayers } from "./rendering-layers";

let cameraCount = 0;

export const CAMERA_Z_POSITION = 100_000;

export const ZOOM_FACTOR = 1.1;
export const MIN_ZOOM = 0.01;
export const MAX_ZOOM = 100;

export class MainCamera {
    private _camera: THREE.OrthographicCamera;

    public get camera(): THREE.OrthographicCamera {
        return this._camera;
    }

    public get cameraCount(): number {
        return cameraCount;
    }

    private _width: number = 1;
    private _height: number = 1;
    private _unsubscribe: () => void;

    public constructor(width: number, height: number) {
        this._width = width;
        this._height = height;

        this._camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, CAMERA_Z_POSITION);
        this._camera.position.set(0, 0, CAMERA_Z_POSITION);

        this._camera.layers.enable(RenderingLayers.SURFACES);
        this._camera.layers.enable(RenderingLayers.SELECTION_BOX);

        this._unsubscribe = mainRendering.subscribe(({ position, zoom }) => {
            this.applyState(position, zoom);
        });

        cameraCount++;
    }

    private applyState(position: Position, zoom: number) {
        const halfW = this._width / (2 * zoom);
        const halfH = this._height / (2 * zoom);

        this._camera.left = position[0] - halfW;
        this._camera.right = position[0] + halfW;
        this._camera.top = position[1] + halfH;
        this._camera.bottom = position[1] - halfH;

        this._camera.updateProjectionMatrix();
    }

    public resize(width: number, height: number) {
        this._width = width;
        this._height = height;
        const { position, zoom } = get(mainRendering);
        this.applyState(position, zoom);
    }

    public dispose() {
        this._unsubscribe();
        cameraCount--;
    }
}
