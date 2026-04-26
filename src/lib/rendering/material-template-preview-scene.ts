import * as THREE from "three";
import { materialTemplateStore } from "../stores/material-templates";
import type { MaterialTemplate } from "../logic/material-templates/material-templates";

import defaultVertexShader from "../../shaders/default-material-template.vert?raw";
import defaultFragmentShader from "../../shaders/default-material-template.frag?raw";
import { log } from "../logging/logger";

export class MaterialTemplatePreviewScene {

    private scene: THREE.Scene;

    private _camera: THREE.OrthographicCamera;
    public get camera(): THREE.OrthographicCamera {
        return this._camera;
    }

    private quad: THREE.Mesh;
    private material: THREE.ShaderMaterial;

    private unsubscribes: (() => void)[] = [];
    
    public get content(): THREE.Scene {
        return this.scene;
    }

    public targetTemplate(id: string) {

        for (const unsubscribe of this.unsubscribes) {
            unsubscribe();
        }
        this.unsubscribes = [];

        const store = materialTemplateStore(id);
        if (!store) {
            log.error("Material template store not found for id", id);
            return;
        }
        
        const unsubscribe = store.subscribe(template => {
            this.updateMaterial(template);
        });
        this.unsubscribes.push(unsubscribe);
    }

    public resize(width: number, height: number) {

        this.quad.scale.set(width, height, 1);
        this.updateCamera(width, height);
    }   


    private updateCamera(width: number, height: number) {

        const halfW = width / 2;
        const halfH = height / 2;

        this._camera.left = -halfW;
        this._camera.right = halfW;
        this._camera.top = halfH;
        this._camera.bottom = -halfH;
        this._camera.updateProjectionMatrix();
    }

    public constructor(id: string) {
        this.scene = new THREE.Scene();
        this.scene.name = "MaterialTemplatePreviewScene";

        this._camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 1000);
        this._camera.position.set(0, 0, 1000);
        this.scene.add(this._camera);

        this.material = new THREE.ShaderMaterial({ vertexShader: defaultVertexShader, fragmentShader: defaultFragmentShader });

        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([
            -0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0,
            -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0,
        ]);
        const uvs = new Float32Array([
            0, 0, 1, 0, 1, 1,
            0, 0, 1, 1, 0, 1,
        ]);
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
        this.quad = new THREE.Mesh(geometry, this.material);
        this.scene.add(this.quad);

        this.targetTemplate(id);
    }

    private updateMaterial(template: MaterialTemplate) {
        this.material.vertexShader = template.vertexShader;
        this.material.fragmentShader = template.fragmentShader;
        this.material.needsUpdate = true;
    }

    public dispose() {
        for (const unsubscribe of this.unsubscribes) {
            unsubscribe();
        }
        this.unsubscribes = [];
        this.scene.clear();
    }
}