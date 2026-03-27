import * as THREE from "three";
import type { MainScene } from "./main-scene";
import type { MainCamera } from "./main-camera";

const FPS_SAMPLE_COUNT = 10;

export class MainRenderer {
    private renderer: THREE.WebGLRenderer;

    public get geometryCount(): number {
        return this.renderer.info.memory.geometries;
    }

    public get textureCount(): number {
        return this.renderer.info.memory.textures;
    }

    private _lastTime = 0;
    private _renderingTime = 0;
    private _timeBetweenFrames = 0;


    public get renderingTime(): number {
        return this._renderingTime;
    }

    public get timeBetweenFrames(): number {
        return this._timeBetweenFrames;
    }

    public get fps(): number {
        return 1000 / this._timeBetweenFrames;
    }

    public constructor(canvas: HTMLCanvasElement) {
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height, false);
    }

    public render(scene: MainScene, camera: MainCamera) {
        const startTime = performance.now();
        this.renderer.render(scene.content, camera.camera);
        const endTime = performance.now();

        this._renderingTime = (this._renderingTime * (FPS_SAMPLE_COUNT - 1) + (endTime - startTime)) / FPS_SAMPLE_COUNT;

        this._timeBetweenFrames = (this._timeBetweenFrames * (FPS_SAMPLE_COUNT - 1) + (endTime - this._lastTime)) / FPS_SAMPLE_COUNT;
        this._lastTime = endTime;
    }

    public dispose() {
        this.renderer.dispose();
    }
}