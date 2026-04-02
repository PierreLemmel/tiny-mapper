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

type QuadSurfaceRenderData = {
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    geometry: THREE.BufferGeometry;
};

type GroupSurfaceRenderData = {
    group: THREE.Group;
    hierarchyData: HierarchyData;
};

type HierarchyData = Readonly<{
    opacity: number;
    color: RawColor;
    flip: SurfaceFlip;
}>

function defaultHierarchyData(): HierarchyData {
    return {
        opacity: 1,
        color: [1, 1, 1, 1],
        flip: [false, false],
    };
}

export class MainScene {
    private scene: THREE.Scene;

    private initialized = false;

    private quadSurfaceMap = new Map<string, QuadSurfaceRenderData>();
    private groupSurfaceMap = new Map<string, GroupSurfaceRenderData>();
    private root: THREE.Group = new THREE.Group();

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

        this.scene.add(this.root);

        const rootHierarchyData: HierarchyData = defaultHierarchyData();
        this.groupSurfaceMap.set("root", { group: this.root, hierarchyData: rootHierarchyData });
        
        for (const rootId of get(rootSurfaces).children) {            
            this.createSurface(this.root, rootHierarchyData, rootId);
        }

        this.sortSurfaces();

        
        eventStore.on("push", e => this.handleEvent(e));
        eventStore.on("undo", e => this.handleEvent(e));
        eventStore.on("redo", e => this.handleEvent(e));
    }

    private handleEvent(event: AppEvent) {
        if (event.category === "Surface") {
            switch (event.type) {
                case "TreeMoved":
                    this.checkHierarchy();
                    this.sortSurfaces();
                    break;
                case "Deleted":
                    this.checkHierarchy();
                    this.sortSurfaces();
                    break;
                case "Created":
                    this.checkHierarchy();
                    this.sortSurfaces();
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
            flip
        } = surface;

        const newHierarchyData: HierarchyData = {
            opacity: hierarchyData.opacity * opacity,
            color: multiplyColors(hierarchyData.color, color),
            flip: flipSurface(hierarchyData.flip, flip),
        };

        const groupSurfaceRenderData: GroupSurfaceRenderData = { group, hierarchyData: newHierarchyData };
        this.groupSurfaceMap.set(surface.id, groupSurfaceRenderData);

        for (const childId of surface.children) {
            this.createSurface(group, newHierarchyData, childId);
        }

        this.applyGroupProperties(surface, groupSurfaceRenderData, hierarchyData);

        store.subscribe(s => {

            const parentData = this.groupSurfaceMap.get(surface.parentId)!.hierarchyData;

            this.applyGroupProperties(s, groupSurfaceRenderData, parentData);
        });
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

        parent.add(mesh);
        const quadSurfaceRenderData: QuadSurfaceRenderData = { mesh, material, geometry };
        this.quadSurfaceMap.set(surface.id, quadSurfaceRenderData);

        store.subscribe(s => {
            this.applyQuadProperties(s, quadSurfaceRenderData);
        });
    }

    private applyQuadProperties(surface: QuadSurface, quadSurfaceRenderData: QuadSurfaceRenderData) {
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
        } = parent.hierarchyData;

        const color = multiplyColors(parentColor, surfaceColor);
        const opacity = parentOpacity * surfaceOpacity;
        const flip = flipSurface(parentFlip, surfaceFlip);

        mesh.visible = enabled;
        mesh.position.set(position[0], position[1], mesh.position.z);
        mesh.rotation.z = degreesToRadians(rotation);
        mesh.scale.set(scale[0], scale[1], 1);

        material.uniforms.uColor.value.set(new THREE.Color(color[0], color[1], color[2]));
        material.uniforms.uOpacity.value = opacity;
        material.uniforms.uFeathering.value = feathering;

    }
    
    private applyGroupProperties(surface: GroupSurface, groupSurfaceRenderData: GroupSurfaceRenderData, hierarchyData: HierarchyData) {
        
        const newHierarchyData = this.recalculateHierarchyData(surface, hierarchyData);

        const { group } = groupSurfaceRenderData;

        const {
            transform: {
                position,
                rotation,
                scale
            },
            enabled,
        } = surface;
        group.visible = enabled;
        group.position.set(position[0], position[1], group.position.z);
        group.rotation.z = degreesToRadians(rotation);
        group.scale.set(scale[0], scale[1], 1);

        for (const childId of surface.children) {
            const surface = get(surfaceStore(childId));

            if (surface.type === "Quad") {
                this.applyQuadProperties(surface, this.quadSurfaceMap.get(childId)!);
            }
            else if (surface.type === "Group") {
                this.applyGroupProperties(surface, this.groupSurfaceMap.get(childId)!, newHierarchyData);
            }
        }
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
                geometry
            } = this.quadSurfaceMap.get(id)!;

            mesh.removeFromParent();
            material.dispose();
            geometry.dispose();
            mesh.clear()

            this.quadSurfaceMap.delete(id);
        }

        for (const id of existingGroups) {
            const {
                group
            } = this.groupSurfaceMap.get(id)!;

            group.removeFromParent();
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
        } = surface;

        const newHierarchyData: HierarchyData = {
            opacity: parentData.opacity * opacity,
            color: multiplyColors(parentData.color, color),
            flip: flipSurface(parentData.flip, flip),
        };

        const item = this.groupSurfaceMap.get(surface.id)!;
        item.hierarchyData = newHierarchyData;

        return newHierarchyData;
    }

    private sortSurfaces() {
        let zIndex = CAMERA_Z_POSITION - 1;

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

    private static _instance: MainScene;
    public static instance() {
        if (!this._instance) {
            this._instance = new MainScene();
        }
        return this._instance;
    }
}