import * as THREE from "three";
import type { GroupSurface, QuadSurface, SurfaceGeometry } from "../logic/surfaces/surfaces";

import surfaceVert from "../../shaders/surface.vert?raw";
import surfaceFrag from "../../shaders/surface.frag?raw";
import { get, type Writable } from "svelte/store";
import { surfaceStore, rootSurfaces, surfaceGeometryStore } from "../stores/surfaces";
import { multiplyColors } from "../core/color";
import {
    blendModeToThreeBlendMode,
    flipSurface,
    indicesToUint32Array,
    positionsToFloat32Array,
    requiresPremultipliedAlpha,
    uvsToFloat32Array,
} from "../logic/mapping";
import { degreesToRadians } from "../core/utils";
import { CAMERA_Z_POSITION } from "./main-camera";
import { surfaceUI } from "../stores/user-interface";
import { log } from "../logging/logger";
import { RenderingLayers } from "./rendering-layers";
import type { GroupSurfaceRenderData, HierarchyData, QuadSurfaceRenderData } from "./main-scene-types";

export type MainSceneHierarchyCallbacks = {
    onUpdateSelection: () => void;
    onUpdateHandles: () => void;
};

export class MainSceneHierarchyManager {
    private root: THREE.Group;
    private quadSurfaceMap: Map<string, QuadSurfaceRenderData>;
    private groupSurfaceMap: Map<string, GroupSurfaceRenderData>;
    private callbacks: MainSceneHierarchyCallbacks;

    public constructor(
        root: THREE.Group,
        quadSurfaceMap: Map<string, QuadSurfaceRenderData>,
        groupSurfaceMap: Map<string, GroupSurfaceRenderData>,
        callbacks: MainSceneHierarchyCallbacks
    ) {
        this.root = root;
        this.quadSurfaceMap = quadSurfaceMap;
        this.groupSurfaceMap = groupSurfaceMap;
        this.callbacks = callbacks;
    }

    public createSurface(parent: THREE.Group, hierarchyData: HierarchyData, id: string) {
        const store = surfaceStore(id);
        const surface = get(store);

        if (surface.type === "Quad") {
            this.createQuadSurface(surface, store as Writable<QuadSurface>, parent);
        } else if (surface.type === "Group") {
            this.createGroupSurface(surface, store as Writable<GroupSurface>, parent, hierarchyData);
        }
    }

    public checkHierarchy() {
        const existingSurfaces = new Set(this.quadSurfaceMap.keys());
        const existingGroups = new Set(this.groupSurfaceMap.keys());

        const {
            group: rootGroup,
            hierarchyData,
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
                unsubscribe,
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
                unsubscribe,
            } = this.groupSurfaceMap.get(id)!;

            group.removeFromParent();
            unsubscribe();
            this.groupSurfaceMap.delete(id);
        }
    }

    public sortSurfaces() {
        let zIndex = CAMERA_Z_POSITION - 100;

        const qsMap = this.quadSurfaceMap;
        const gsMap = this.groupSurfaceMap;

        const sortSurface = (id: string) => {
            const surface = get(surfaceStore(id));

            const object = surface.type === "Quad" ? qsMap.get(id)?.mesh : gsMap.get(id)?.group;
            if (!object) {
                log.error(`Position not found for surface '${id}'`);
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
        };

        for (const rootId of get(rootSurfaces).children) {
            sortSurface(rootId);
        }

        this.callbacks.onUpdateHandles();
    }

    private createGroupSurface(
        surface: GroupSurface,
        store: Writable<GroupSurface>,
        parent: THREE.Group,
        hierarchyData: HierarchyData
    ) {
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
            unsubscribe: () => {},
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

    private createQuadSurface(surface: QuadSurface, surfaceStore: Writable<QuadSurface>, parent: THREE.Group) {
        const {
            geometry: {
                vertices,
                uvs,
                indices,
            },
            blendMode,
        } = surface;

        const material = new THREE.ShaderMaterial({
            vertexShader: surfaceVert,
            fragmentShader: surfaceFrag,
            uniforms: {
                uColor: { value: new THREE.Color(1, 1, 1) },
                uOpacity: { value: 1 },
                uFeathering: { value: 0 },
            },
            blending: blendModeToThreeBlendMode(blendMode),
            premultipliedAlpha: requiresPremultipliedAlpha(blendMode),
            transparent: true,
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

        const surfaceUnsub = surfaceStore.subscribe(s => {
            this.applyQuadProperties(s, quadSurfaceRenderData);
        });

        const geometryStore = surfaceGeometryStore(surface.id);
        const geometryUnsub = geometryStore.subscribe(g => {
            this.applyQuadGeometry(g, quadSurfaceRenderData);

            if (get(surfaceUI).selectedSurfaces.includes(surface.id)) {
                this.callbacks.onUpdateSelection();
                this.callbacks.onUpdateHandles();
            }
        });

        quadSurfaceRenderData.unsubscribe = () => {
            surfaceUnsub();
            geometryUnsub();
        };
    }

    private applyQuadProperties(surface: QuadSurface, quadSurfaceRenderData: QuadSurfaceRenderData | undefined) {
        if (!quadSurfaceRenderData) {
            return;
        }

        const {
            mesh,
            material,
        } = quadSurfaceRenderData;

        const {
            transform: {
                position,
                rotation,
                scale,
            },
            enabled,
            color: surfaceColor,
            opacity: surfaceOpacity,
            flip: surfaceFlip,
            feathering,
            blendMode,
            parentId,
        } = surface;

        const parent = this.groupSurfaceMap.get(parentId);
        if (!parent) {
            log.error(`Parent not found for surface '${surface.id}' (parentId: '${surface.parentId}')`);
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

        material.blending = blendModeToThreeBlendMode(blendMode);
        material.premultipliedAlpha = requiresPremultipliedAlpha(blendMode);
        material.uniforms.uColor.value.set(new THREE.Color(color[0], color[1], color[2]));
        material.uniforms.uOpacity.value = opacity;
        material.uniforms.uFeathering.value = Math.max(parentFeathering, feathering);

        this.callbacks.onUpdateSelection();
        if (get(surfaceUI).selectedSurfaces.includes(surface.id)) {
            this.callbacks.onUpdateHandles();
        }
    }

    private applyQuadGeometry(geometry: SurfaceGeometry, quadSurfaceRenderData: QuadSurfaceRenderData | undefined) {
        if (!quadSurfaceRenderData) {
            return;
        }

        const {
            geometry: meshGeometry,
        } = quadSurfaceRenderData;

        const posAttribute = meshGeometry.getAttribute("position");
        const buffer = posAttribute?.array as Float32Array;

        buffer.set(positionsToFloat32Array(geometry.vertices));
        posAttribute.needsUpdate = true;

        meshGeometry.computeBoundingBox();
    }

    private applyGroupProperties(
        surface: GroupSurface,
        groupSurfaceRenderData: GroupSurfaceRenderData | undefined,
        hierarchyData: HierarchyData
    ) {
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
            const surfaceChild = get(surfaceStore(childId));

            if (surfaceChild.type === "Quad") {
                this.applyQuadProperties(surfaceChild, this.quadSurfaceMap.get(childId));
            } else if (surfaceChild.type === "Group") {
                this.applyGroupProperties(surfaceChild, this.groupSurfaceMap.get(childId), newHierarchyData);
            }
        }

        this.callbacks.onUpdateSelection();
    }

    private checkSurface(parent: THREE.Group, hierarchyData: HierarchyData, id: string) {
        const store = surfaceStore(id);
        const surface = get(store);

        if (surface.type === "Quad") {
            return this.checkQuadSurface(parent, store as Writable<QuadSurface>, hierarchyData, id);
        } else if (surface.type === "Group") {
            return this.checkGroupSurface(parent, store as Writable<GroupSurface>, hierarchyData, id);
        } else {
            throw new Error(`Unknown surface type for surface '${id}'`);
        }
    }

    private checkQuadSurface(
        parent: THREE.Group,
        store: Writable<QuadSurface>,
        hierarchyData: HierarchyData,
        id: string
    ): string[] {
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

    private checkGroupSurface(
        parent: THREE.Group,
        store: Writable<GroupSurface>,
        hierarchyData: HierarchyData,
        id: string
    ): string[] {
        const surface = get(store);
        if (!this.groupSurfaceMap.has(id)) {
            this.createGroupSurface(surface, store, parent, hierarchyData);
        }

        const newHierarchyData = this.recalculateHierarchyData(surface, hierarchyData);

        const { children } = surface;
        const { group } = this.groupSurfaceMap.get(id)!;
        const checkedIds = children.flatMap(childId => this.checkSurface(group, newHierarchyData, childId));
        parent.attach(group);

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
}
