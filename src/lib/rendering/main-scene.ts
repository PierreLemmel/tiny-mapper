import * as THREE from "three";
import type { GroupSurface, QuadSurface } from "../logic/surfaces/surfaces";

import surfaceVert from "../../shaders/surface.vert?raw";
import surfaceFrag from "../../shaders/surface.frag?raw";
import { get, type Writable } from "svelte/store";
import { surfaceStore, rootSurfaces } from "../stores/surfaces";
import { multiplyColors, type RawColor } from "../core/color";
import { flipSurface, indicesToUint32Array, positionsToFloat32Array, uvsToFloat32Array, type SurfaceFlip } from "../logic/mapping";
import { degreesToRadians } from "../core/utils";
import { CAMERA_Z_POSITION } from "./main-camera";
import { eventStore, type AppEvent } from "../events/event-store";
import { surfaceUI } from "../stores/user-interface";
import { uiSettings } from "../stores/settings";
import { RenderingLayers } from "./rendering-layers";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";

type QuadSurfaceRenderData = {
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    geometry: THREE.BufferGeometry;
    unsubscribe: () => void;
};

type GroupSurfaceRenderData = {
    group: THREE.Group;
    hierarchyData: HierarchyData;
    unsubscribe: () => void;
};

type HierarchyData = Readonly<{
    opacity: number;
    color: RawColor;
    flip: SurfaceFlip;
    feathering: number;
}>

function defaultHierarchyData(): HierarchyData {
    return {
        opacity: 1,
        color: [1, 1, 1, 1],
        flip: [false, false],
        feathering: 0,
    };
}

const SELECTION_Z_POSITION = CAMERA_Z_POSITION - 1;
const SELECTION_BOX_WIDTH = 3;

export class MainScene {
    private scene: THREE.Scene;

    private initialized = false;

    private quadSurfaceMap = new Map<string, QuadSurfaceRenderData>();
    private groupSurfaceMap = new Map<string, GroupSurfaceRenderData>();
    private root: THREE.Group = new THREE.Group();
    private selectionBox: THREE.Group = new THREE.Group();

    private unsubscribeSelectionUI: () => void = () => {};
    private unsubscribeSelectionColor: () => void = () => {};           
    public get content(): THREE.Scene {
        return this.scene;
    }

    private constructor() {
        this.scene = new THREE.Scene();
    }

    public initializeSceneIfNeeded() {
        if (this.initialized) {
            console.warn("Scene already initialized");
            return;
        }

        (window as any).mainScene = this;

        this.initialized = true;

        this.createRoot();
        this.createSelectionBox();

        const rootHierarchyData: HierarchyData = defaultHierarchyData();
        this.groupSurfaceMap.set("root", {
            group: this.root,
            hierarchyData: rootHierarchyData,
            unsubscribe: () => {}
        });
        
        for (const rootId of get(rootSurfaces).children) {            
            this.createSurface(this.root, rootHierarchyData, rootId);
        }

        this.sortSurfaces();

        eventStore.on("push", e => this.handleEvent(e));
        eventStore.on("undo", e => this.handleEvent(e));
        eventStore.on("redo", e => this.handleEvent(e));

        this.unsubscribeSelectionUI = surfaceUI.subscribe(ui => {
            this.updateSelectionBox();
        });
    }

    private createRoot() {
        this.root.name = "root";
        this.root.userData.id = "root";
        this.scene.add(this.root);
    }

    private createSelectionBox() {
        this.selectionBox.name = "selectionBox";
        this.selectionBox.userData.id = "selectionBox";
        this.scene.add(this.selectionBox);

        const selectionGeometry = new THREE.PlaneGeometry(1, 1);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            depthTest: false,
        });
        const selectionBackground = new THREE.Mesh(selectionGeometry, bgMaterial);
        selectionBackground.name = "Selection Background";


        const outlineGeometry = new LineGeometry();
        outlineGeometry.setPositions([
            -0.5, -0.5, 0,
            0.5, -0.5, 0,
            0.5, 0.5, 0,
            -0.5, 0.5, 0,
            -0.5, -0.5, 0,
        ]);


        const outlineMaterial = new LineMaterial({
            color: 0xfffff,
            linewidth: SELECTION_BOX_WIDTH, 
            resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
            depthWrite: false,
            depthTest: false,
        });

        const selectionOutline = new Line2(
            outlineGeometry,
            outlineMaterial
        );
        selectionOutline.name = "Selection Outline";

        this.selectionBox.add(selectionBackground);
        this.selectionBox.add(selectionOutline);

        this.selectionBox.layers.set(RenderingLayers.SELECTION_BOX);
        selectionBackground.layers.set(RenderingLayers.SELECTION_BOX);
        selectionOutline.layers.set(RenderingLayers.SELECTION_BOX);

        this.selectionBox.renderOrder = 999;
        selectionBackground.renderOrder = 998;
        selectionOutline.renderOrder = 999;

        this.unsubscribeSelectionColor = uiSettings.subscribe(settings => {       
            bgMaterial.color.set(settings.selectionColor[0], settings.selectionColor[1], settings.selectionColor[2]);
            outlineMaterial.color.set(settings.selectionColor[0], settings.selectionColor[1], settings.selectionColor[2]);
        });
    }

    private handleEvent(event: AppEvent) {
        if (event.category === "Surface") {
            switch (event.type) {
                case "TreeMoved":
                    this.checkHierarchy();
                    this.sortSurfaces();
                    this.updateSelectionBox();
                    break;
                case "Deleted":
                    this.checkHierarchy();
                    this.sortSurfaces();
                    this.updateSelectionBox();
                    break;
                case "Created":
                    this.checkHierarchy();
                    this.sortSurfaces();
                    this.updateSelectionBox();
                    break;
            }
        }
    }

    private createSurface(parent: THREE.Group, hierarchyData: HierarchyData, id: string) {
        const store = surfaceStore(id);
        const surface = get(store);

        if (surface.type === "Quad") {
            this.createQuadSurface(surface, store as Writable<QuadSurface>, parent);
        }
        else if (surface.type === "Group") {
            this.createGroupSurface(surface, store as Writable<GroupSurface>, parent, hierarchyData);
        }
    }

    private createGroupSurface(surface: GroupSurface, store: Writable<GroupSurface>, parent: THREE.Group, hierarchyData: HierarchyData) {
        const group = new THREE.Group();
        
        parent.add(group);

        const {
            color,
            opacity,
            flip,
            feathering,
        } = surface;

        const newHierarchyData: HierarchyData = {
            opacity: hierarchyData.opacity * opacity,
            color: multiplyColors(hierarchyData.color, color),
            flip: flipSurface(hierarchyData.flip, flip),
            feathering: Math.max(hierarchyData.feathering, feathering),
        };


        const groupSurfaceRenderData: GroupSurfaceRenderData = {
            group,
            hierarchyData: newHierarchyData,
            unsubscribe: () => {}
        };
        group.userData.id = surface.id;
        group.userData.type = "Group";
        group.layers.enable(RenderingLayers.SURFACES);
        this.groupSurfaceMap.set(surface.id, groupSurfaceRenderData);


        const unsubscribe = store.subscribe(s => {
            const parentData = this.groupSurfaceMap.get(surface.parentId)!.hierarchyData;

            this.applyGroupProperties(s, groupSurfaceRenderData, parentData);
        });

        groupSurfaceRenderData.unsubscribe = unsubscribe;

        for (const childId of surface.children) {
            this.createSurface(group, newHierarchyData, childId);
        }
    }

    private createQuadSurface(surface: QuadSurface, store: Writable<QuadSurface>, parent: THREE.Group) {

        const {
            geometry: {
                vertices,
                uvs,
                indices
            },
        } = surface;

        const material = new THREE.ShaderMaterial({
            vertexShader: surfaceVert,
            fragmentShader: surfaceFrag,
            uniforms: {
                uColor: { value: new THREE.Color(1, 1, 1) },
                uOpacity: { value: 1 },
                uFeathering: { value: 0 }
            },
            transparent: true
        });


        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positionsToFloat32Array(vertices), 3));
        geometry.setIndex(new THREE.BufferAttribute(indicesToUint32Array(indices), 1));
        geometry.setAttribute("uv", new THREE.BufferAttribute(uvsToFloat32Array(uvs), 2));

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.id = surface.id;
        mesh.userData.type = "Quad";
        mesh.layers.enable(RenderingLayers.SURFACES);
        parent.add(mesh);
        
        const quadSurfaceRenderData: QuadSurfaceRenderData = { mesh, material, geometry, unsubscribe: () => {} };
        this.quadSurfaceMap.set(surface.id, quadSurfaceRenderData);

        const unsubscribe = store.subscribe(s => {
            this.applyQuadProperties(s, quadSurfaceRenderData);
        });
        quadSurfaceRenderData.unsubscribe = unsubscribe;
    }

    private applyQuadProperties(surface: QuadSurface, quadSurfaceRenderData: QuadSurfaceRenderData | undefined) {
        if (!quadSurfaceRenderData) {
            return;
        }

        const {
            mesh,
            material
        } = quadSurfaceRenderData;

        const {
            transform: {
                position,
                rotation,
                scale
            },
            enabled,
            color: surfaceColor,
            opacity: surfaceOpacity,
            flip: surfaceFlip,
            feathering,
            parentId
        } = surface;

        const parent = this.groupSurfaceMap.get(parentId);
        if (!parent) {
            console.error(`Parent not found for surface '${surface.id}' (parentId: '${surface.parentId}')`);
            return;
        }

        const {
            color: parentColor,
            opacity: parentOpacity,
            flip: parentFlip,
            feathering: parentFeathering,
        } = parent.hierarchyData;

        const color = multiplyColors(parentColor, surfaceColor);
        const opacity = parentOpacity * surfaceOpacity;
        const flip = flipSurface(parentFlip, surfaceFlip);

        mesh.visible = enabled;
        mesh.position.set(position[0], position[1], mesh.position.z);
        mesh.rotation.z = degreesToRadians(rotation);
        mesh.scale.set(scale[0], scale[1], 1);

        mesh.name = surface.name;

        material.uniforms.uColor.value.set(new THREE.Color(color[0], color[1], color[2]));
        material.uniforms.uOpacity.value = opacity;
        material.uniforms.uFeathering.value = Math.max(parentFeathering, feathering);

        this.updateSelectionBox();
    }
    
    private applyGroupProperties(surface: GroupSurface, groupSurfaceRenderData: GroupSurfaceRenderData | undefined, hierarchyData: HierarchyData) {
        if (!groupSurfaceRenderData) {
            return;
        }

        
        const newHierarchyData = this.recalculateHierarchyData(surface, hierarchyData);

        const { group } = groupSurfaceRenderData;

        const {
            transform: {
                position,
                rotation,
                scale,
            },
            name,
            enabled,
        } = surface;
        group.visible = enabled;
        group.position.set(position[0], position[1], group.position.z);
        group.rotation.z = degreesToRadians(rotation);
        group.scale.set(scale[0], scale[1], 1);

        group.name = name;

        for (const childId of surface.children) {
            const surface = get(surfaceStore(childId));

            if (surface.type === "Quad") {
                this.applyQuadProperties(surface, this.quadSurfaceMap.get(childId));
            }
            else if (surface.type === "Group") {
                this.applyGroupProperties(surface, this.groupSurfaceMap.get(childId), newHierarchyData);
            }
        }

        this.updateSelectionBox();
    }

    private checkHierarchy() {

        const existingSurfaces = new Set(this.quadSurfaceMap.keys());
        const existingGroups = new Set(this.groupSurfaceMap.keys());
        
        const {
            group: rootGroup,
            hierarchyData
        } = this.groupSurfaceMap.get("root")!;
        existingGroups.delete("root");

        for (const id of get(rootSurfaces).children) {
            const checkedIds = this.checkSurface(rootGroup, hierarchyData, id);
            for (const removedId of checkedIds) {
                existingSurfaces.delete(removedId);
                existingGroups.delete(removedId);
            }
        }

        for (const id of existingSurfaces) {
            const {
                mesh,
                material,
                geometry,
                unsubscribe
            } = this.quadSurfaceMap.get(id)!;

            mesh.removeFromParent();
            material.dispose();
            geometry.dispose();
            mesh.clear();
            unsubscribe();

            this.quadSurfaceMap.delete(id);
        }

        for (const id of existingGroups) {
            const {
                group,
                unsubscribe
            } = this.groupSurfaceMap.get(id)!;

            group.removeFromParent();
            unsubscribe();
            this.groupSurfaceMap.delete(id);
        }
    }

    private checkSurface(parent: THREE.Group, hierarchyData: HierarchyData, id: string) {
        const store = surfaceStore(id);
        const surface = get(store);

        if (surface.type === "Quad") {
            return this.checkQuadSurface(parent, store as Writable<QuadSurface>, hierarchyData, id);
        }
        else if (surface.type === "Group") {
            return this.checkGroupSurface(parent, store as Writable<GroupSurface>, hierarchyData, id);
        }
        else {
            throw new Error(`Unknown surface type for surface '${id}'`);
        }
    }
    
    private checkQuadSurface(parent: THREE.Group, store: Writable<QuadSurface>, hierarchyData: HierarchyData, id: string): string[] {
        const surface = get(store);
        if (!this.quadSurfaceMap.has(id)) {
            this.createQuadSurface(surface, store, parent);
        }
        
        const {
            mesh,
        } = this.quadSurfaceMap.get(id)!;
        parent.attach(mesh);

        this.applyQuadProperties(surface, this.quadSurfaceMap.get(id)!);

        return [id];
    }

    private checkGroupSurface(parent: THREE.Group, store: Writable<GroupSurface>, hierarchyData: HierarchyData, id: string): string[] {
        
        const surface = get(store);
        if (!this.groupSurfaceMap.has(id)) {
            this.createGroupSurface(surface, store, parent, hierarchyData);
        }

        const newHierarchyData = this.recalculateHierarchyData(surface, hierarchyData);

        const { children } = surface;
        const { group } = this.groupSurfaceMap.get(id)!;
        const checkedIds = children.flatMap(childId => this.checkSurface(group, newHierarchyData, childId));
        parent.attach(group)

        return [id, ...checkedIds];
    }

    private recalculateHierarchyData(surface: GroupSurface, parentData: HierarchyData): HierarchyData {
        const {
            color,
            opacity,
            flip,
            feathering,
        } = surface;

        const newHierarchyData: HierarchyData = {
            opacity: parentData.opacity * opacity,
            color: multiplyColors(parentData.color, color),
            flip: flipSurface(parentData.flip, flip),
            feathering: Math.max(parentData.feathering, feathering),
        };

        const item = this.groupSurfaceMap.get(surface.id)!;
        item.hierarchyData = newHierarchyData;

        return newHierarchyData;
    }

    private sortSurfaces() {
        let zIndex = CAMERA_Z_POSITION - 100;

        const qsMap = this.quadSurfaceMap;
        const gsMap = this.groupSurfaceMap;

        function sortSurface(id: string) {
            const surface = get(surfaceStore(id));

            const object = surface.type === "Quad" ? qsMap.get(id)?.mesh : gsMap.get(id)?.group;
            if (!object) {
                console.error(`Position not found for surface '${id}'`);
                return;
            }

            const worldPosition: THREE.Vector3 = object.getWorldPosition(new THREE.Vector3());
            worldPosition.setZ(zIndex--);

            object.parent!.worldToLocal(worldPosition);
            object.position.copy(worldPosition);

            if (surface.type === "Group") {
                const { children } = surface;
                for (const childId of children) {
                    sortSurface(childId);
                }
            }
        }

        for (const rootId of get(rootSurfaces).children) {
            sortSurface(rootId);
        }
    }

    private updateSelectionBox() {
        const selectedIds = get(surfaceUI).selectedSurfaces;

        if (selectedIds.length !== 0) {
            this.selectionBox.visible = true;

            let box = new THREE.Box3();
            for (const id of selectedIds) {
                const object = this.quadSurfaceMap.get(id)?.mesh ?? this.groupSurfaceMap.get(id)?.group;
                if (!object) continue;
                
                const boundingBox = new THREE.Box3();
                boundingBox.setFromObject(object);
                box = box.union(boundingBox);
            }

            const center = new THREE.Vector3();
            box.getCenter(center);

            const { x, y } = center;

            const size = new THREE.Vector3();
            box.getSize(size);

            const { x: width, y: height } = size;

            this.selectionBox.position.set(x, y, SELECTION_Z_POSITION);
            this.selectionBox.scale.set(width + SELECTION_BOX_WIDTH / 2 - 1, height + SELECTION_BOX_WIDTH / 2 - 1, 1);
        }
        else {
            this.selectionBox.visible = false;
        }
    }

    private static _instance: MainScene;
    public static instance() {
        if (!this._instance) {
            this._instance = new MainScene();
        }
        return this._instance;
    }

    public dispose() {
        this.unsubscribeSelectionUI();
        this.unsubscribeSelectionColor();

        for (const quadSurfaceRenderData of this.quadSurfaceMap.values()) {
            quadSurfaceRenderData.unsubscribe();
        }
        for (const groupSurfaceRenderData of this.groupSurfaceMap.values()) {
            groupSurfaceRenderData.unsubscribe();
        }
        
        this.quadSurfaceMap.clear();
        this.groupSurfaceMap.clear();
    }
}