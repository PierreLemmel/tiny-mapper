import * as THREE from "three";
import type { MainScene } from "./main-scene";
import type { MainCamera } from "./main-camera";

import { log } from "../logging/logger";
import type { Rect } from "../logic/mapping";
import { createId, remap } from "../core/utils";
import { hsvaToRgba, NEUTRAL_COLOR, rawColorToThreeColor } from "../core/color";
import { uiSettings } from "../stores/settings";
import { get } from "svelte/store";

const FPS_SAMPLE_COUNT = 10;

type RenderingItem = {
    scene: THREE.Scene;
    camera: THREE.Camera;
    target: HTMLElement;
    matchViewPortToArea: boolean;
}

export class MainRenderer {
    private renderer: THREE.WebGLRenderer;
    private canvas: HTMLCanvasElement;

    public get geometryCount(): number {
        return this.renderer.info.memory.geometries;
    }

    public get scissorsCount(): number {
        return this._renderingItems.size;
    }

    public get textureCount(): number {
        return this.renderer.info.memory.textures;
    }

    public get threeRenderer(): THREE.WebGLRenderer {
        return this.renderer;
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
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setScissorTest(true);
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height, false);
    }

    public initialize() {

        this.initialized = true;
    }

    private _renderingItems: Map<string, RenderingItem> = new Map();

    public addItemToRendering(camera: THREE.Camera, scene: THREE.Scene, target: HTMLElement, matchViewPortToArea: boolean) {
        const id = createId();
        this._renderingItems.set(id, { camera, scene, target, matchViewPortToArea });
        return id;
    }

    public removeItemFromRendering(id: string) {
        this._renderingItems.delete(id);
    }

    public performRenderings() {

        if (!this.initialized) {
            log.error("Renderer not initialized, called initialize first");
            return;
        }

        const startTime = performance.now();

        const endTime = performance.now();

        this.renderer.setClearAlpha(0);
        this.renderer.setClearColor(rawColorToThreeColor(get(uiSettings).renderingBackgroundColor), 0);
        this.renderer.clear();
        this.renderer.setClearAlpha(1);

        const canvasRect = this.canvas.getBoundingClientRect();
        for (const item of this._renderingItems.values()) {
            this.renderItem(item, canvasRect);
        }
        this._renderingTime = (this._renderingTime * (FPS_SAMPLE_COUNT - 1) + (endTime - startTime)) / FPS_SAMPLE_COUNT;

        this._timeBetweenFrames = (this._timeBetweenFrames * (FPS_SAMPLE_COUNT - 1) + (endTime - this._lastTime)) / FPS_SAMPLE_COUNT;
        this._lastTime = endTime;
    }

    private renderItem(item: RenderingItem, canvasRect: DOMRect) {
        const {
            height: canvasHeight,
            width: canvasWidth,
            top: canvasTop,
            left: canvasLeft,
            bottom: canvasBottom,
            right: canvasRight,
        } = canvasRect;

        const {
            target,
            scene,
            camera,
            matchViewPortToArea,
        } = item;

        const {
            top: targetTop,
            left: targetLeft,
            bottom: targetBottom,
            right: targetRight,
        } = target.getBoundingClientRect();

        if (
            targetRight < canvasLeft ||
            targetLeft > canvasRight ||
            targetBottom < canvasTop ||
            targetTop > canvasBottom
        ) {
            return;
        }

        const scissorX = targetLeft - canvasLeft;
        const scissorY = canvasHeight - (targetBottom - canvasTop);
        const scissorWidth = targetRight - targetLeft;
        const scissorHeight = targetBottom - targetTop;

        if (matchViewPortToArea) {
            this.renderer.setViewport(scissorX, scissorY, scissorWidth, scissorHeight);
        } else {
            this.renderer.setViewport(0, 0, canvasWidth, canvasHeight);
        }
        
        this.renderer.setScissor(scissorX, scissorY, scissorWidth, scissorHeight);
        this.renderer.render(scene, camera);
    }

    public getNDCCoordinates(clientX: number, clientY: number): [number, number] {
        const {
            top: canvasTop,
            left: canvasLeft,
            bottom: canvasBottom,
            right: canvasRight,
        } = this.canvas.getBoundingClientRect();

        const ndcX = remap(clientX, canvasLeft, canvasRight, -1, 1);
        const ndcY = remap(clientY, canvasTop, canvasBottom, 1, -1);
        
        return [ndcX, ndcY];
    }

    public dispose() {
        this.renderer.dispose();
    }
}