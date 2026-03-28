import * as THREE from "three";
import type { Surface } from "../logic/surfaces";
import { surfaces as surfacesData, type SurfaceData } from "../stores/content";


import { get } from "svelte/store";

export class MainScene {
    private scene: THREE.Scene;

    public get content(): THREE.Scene {
        return this.scene;
    }

    private constructor() {
        this.scene = new THREE.Scene();

        this.initializeScene(get(surfacesData));
    }

    private initializeScene(content: SurfaceData) {

    }

    private static _instance: MainScene;
    public static instance() {
        if (!this._instance) {
            this._instance = new MainScene();
        }
        return this._instance;
    }
}