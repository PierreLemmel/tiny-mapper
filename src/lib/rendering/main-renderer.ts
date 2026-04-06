import * as THREE from "three";
import type { MainScene } from "./main-scene";
import type { MainCamera } from "./main-camera";

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass.js";
import { log } from "../logging/logger";

const FPS_SAMPLE_COUNT = 10;

export class MainRenderer {
    private renderer: THREE.WebGLRenderer;

    private composer: EffectComposer;
    private renderPass: RenderPass|null = null;
    private outlinePass: OutlinePass|null = null;
    private renderTarget: THREE.WebGLRenderTarget = new THREE.WebGLRenderTarget(1, 1);

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
        const size = this.renderer.getSize(new THREE.Vector2());
        const pixelRatio = this.renderer.getPixelRatio();
        this.renderTarget = new THREE.WebGLRenderTarget(
            size.width * pixelRatio,
            size.height * pixelRatio,
            {
                samples: 4,
            }
        );
        this.composer = new EffectComposer(this.renderer, this.renderTarget);
    }

    public resize(width: number, height: number) {
        this.renderer.setSize(width, height, false);

        const pixelRatio = this.renderer.getPixelRatio();
        this.composer.setSize(width, height);
        this.composer.setPixelRatio(pixelRatio);

        const pw = width * pixelRatio
        const ph = height * pixelRatio

        if (this.outlinePass) {
            this.outlinePass.setSize(pw, ph);
            this.outlinePass.resolution.set(pw, ph);
        }

        if (this.renderPass) {
            this.renderPass.setSize(pw, ph);
        }
    }

    public initialize(scene: MainScene, camera: MainCamera, [width, height]: [number, number]) {
        
        this.renderPass = new RenderPass(scene.content, camera.camera);

        this.composer.setSize(width, height);
        const pixelRatio = this.renderer.getPixelRatio();
        this.composer.setPixelRatio(this.renderer.getPixelRatio());

        const outlineSize = new THREE.Vector2(width * pixelRatio, height * pixelRatio);
        this.outlinePass = new OutlinePass(outlineSize, scene.content, camera.camera);

        this.outlinePass.visibleEdgeColor.set(new THREE.Color(1.0, 0.0, 1.0));
        this.outlinePass.edgeGlow = 0.0;
        this.outlinePass.edgeStrength = 10;
        this.outlinePass.edgeThickness = 3.0;

        scene.outliner.addListener((objects) => {

            if (!this.outlinePass) {
                return;
            }
        
            this.outlinePass.selectedObjects = objects;
        });

        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.outlinePass);

        this.initialized = true;
    }

    public render(scene: MainScene, camera: MainCamera) {
        const startTime = performance.now();

        if (!this.initialized) {
            log.error("Renderer not initialized, called initialize first");
            return;
        }

        this.composer.render();
        //this.renderer.render(scene.content, camera.camera);
        const endTime = performance.now();

        this._renderingTime = (this._renderingTime * (FPS_SAMPLE_COUNT - 1) + (endTime - startTime)) / FPS_SAMPLE_COUNT;

        this._timeBetweenFrames = (this._timeBetweenFrames * (FPS_SAMPLE_COUNT - 1) + (endTime - this._lastTime)) / FPS_SAMPLE_COUNT;
        this._lastTime = endTime;
    }

    public dispose() {
        this.renderer.dispose();
    }
}