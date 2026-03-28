import * as THREE from "three";
import type { QuadSurface } from "../logic/surfaces";

import surfaceVert from "../../shaders/surface.vert?raw";
import surfaceFrag from "../../shaders/surface.frag?raw";
import { get } from "svelte/store";

export type SurfaceRenderData = {
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
};

export class MainScene {
    private scene: THREE.Scene;

    private initialized = false;
    private readonly quadGeometry = new THREE.PlaneGeometry(1, 1);

    private surfacesMap = new Map<string, SurfaceRenderData>();

    public get content(): THREE.Scene {
        return this.scene;
    }

    private constructor() {
        this.scene = new THREE.Scene();
    }

    public initializeScene() {
        if (this.initialized) {
            console.warn("Scene already initialized");
            return;
        }

        this.initialized = true;

        console.log("initializing scene");
    }

    private createQuadSurface(surface: QuadSurface) {
        console.log("creating quad surface", surface);
        const material = new THREE.ShaderMaterial({
            vertexShader: surfaceVert,
            fragmentShader: surfaceFrag,
            transparent: true
        });
        const mesh = new THREE.Mesh(this.quadGeometry, material);

        this.scene.add(mesh);
        this.surfacesMap.set(surface.id, { mesh, material });
    }

    private static _instance: MainScene;
    public static instance() {
        if (!this._instance) {
            this._instance = new MainScene();
        }
        return this._instance;
    }
}