import * as THREE from "three";
import type { MainScene } from "./main-scene";
import type { MainCamera } from "./main-camera";

import { log } from "../logging/logger";
import type { Rect } from "../logic/mapping";

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

    private initialized = false;

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
        this.renderer.setScissorTest(true);
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height, false);
    }

    public initialize() {

        this.initialized = true;
    }

    public renderMainscene(camera: MainCamera, scene: MainScene, rect: Rect) {
        const startTime = performance.now();

        if (!this.initialized) {
            log.error("Renderer not initialized, called initialize first");
            return;
        }

        this.renderer.setScissor(rect.x, rect.y, rect.width, rect.height);
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