import { get } from "svelte/store";
import * as THREE from "three";
import { mainRenderer } from "../stores/rendering";
import { splitShaderErrors, type CompileTemplateResult } from "./compilation";
import { log } from "../logging/logger";

export class CompilationScene {
    private scene: THREE.Scene;
    private quad: THREE.Mesh;
    private camera: THREE.OrthographicCamera;

    public constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1000);
        this.camera.position.set(0, 0, -10);
        this.scene.add(this.camera);
        this.quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        this.camera.lookAt(0, 0, 0);
        this.scene.add(this.quad);
    }

    private initialized = false;
    public initialize() {
        if (this.initialized) {
            log.warn("Trying to initialize compilation scene that is already initialized");
            return;
        }

        const renderer = get(mainRenderer);

        if (!renderer) {
            log.error("Impossible to initialize compilation scene: renderer not initialized");
            return;
        }

        const gl = renderer.threeRenderer;
        
        gl.debug.checkShaderErrors = true;
    }

    public async compile(vertexShader: string, fragmentShader: string): Promise<CompileTemplateResult> {

        const oldMaterial = this.quad.material;

        const material = new THREE.ShaderMaterial({vertexShader, fragmentShader });
        this.quad.material = material;

        const renderer = get(mainRenderer);
        if (!renderer) {
            const errorMsg = "Renderer not initialized";
            log.error(errorMsg);
            return {
                success: false,
                fragmentShaderErrors: null,
                vertexShaderErrors: null,
                compilationErrors: [errorMsg],
            };
        }

        const three = renderer.threeRenderer;
        const gl = three.getContext();
        this.quad.material = material;


        await three.compileAsync(this.scene, this.camera);

        const glProgram: WebGLProgram = (three.properties.get(material) as any).currentProgram;
        const glVertexShader: WebGLShader = (glProgram as any).vertexShader;
        const glFragmentShader: WebGLShader = (glProgram as any).fragmentShader;

        const vertexShaderInfo = gl.getShaderInfoLog(glVertexShader);
        const fragmentShaderInfo = gl.getShaderInfoLog(glFragmentShader);
        const vertexShaderSuccess: boolean = gl.getShaderParameter(glVertexShader, gl.COMPILE_STATUS);
        const fragmentShaderSuccess: boolean = gl.getShaderParameter(glFragmentShader, gl.COMPILE_STATUS);

        this.quad.material = oldMaterial;
        material.dispose();

        if (vertexShaderSuccess && fragmentShaderSuccess) {
            return {
                success: true,
            };
        }
        else {
            return {
                success: false,
                fragmentShaderErrors: splitShaderErrors(fragmentShaderInfo),
                vertexShaderErrors: splitShaderErrors(vertexShaderInfo),
                compilationErrors: null,
            };
        }
    }

    public dispose() {
        this.scene.clear();
        this.quad.geometry.dispose();
        if (this.quad.material instanceof THREE.Material) {
            this.quad.material.dispose();
        }
        this.camera.clear();
    }
}