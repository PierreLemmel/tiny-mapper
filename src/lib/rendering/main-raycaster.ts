import * as THREE from "three";
import type { MainCamera } from "./main-camera";
import type { MainScene } from "./main-scene";
import { RenderingLayers } from "./rendering-layers";
import type { SurfaceType } from "../logic/surfaces/surfaces";
import { get } from "svelte/store";
import { surfaceGeometryStore, surfaceStore } from "../stores/surfaces";
import { log } from "../logging/logger";

export type RaycastResult = {
    type: "Nothing";
} | {
    type: "Surface";
    surfaceId: string;
    surfaceType: SurfaceType;
} | {
    type: "Vertex";
    surfaceId: string;
    surfaceType: SurfaceType;
    vertices: number[];
}

export class MainRaycaster {
    private raycaster: THREE.Raycaster;
    
    private _camera: MainCamera;
    private _scene: MainScene;

    public constructor(camera: MainCamera, scene: MainScene) {
        this._camera = camera;
        this._scene = scene;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.set(RenderingLayers.SURFACES);
    }

    public castRay(ndcX: number, ndcY: number, selectionThreshold: number): RaycastResult {

        this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this._camera.camera);

        const intersects = this.raycaster.intersectObjects(this._scene.content.children);

        if (intersects.length === 0) {
            return { type: "Nothing" };
        }

        const {
            object,
            face,
            point
        } = intersects[0];

        const surfaceId = object.userData.id;
        const surfaceType = object.userData.type as SurfaceType;
        
        if (face) {
            const {
                a,
                b,
                c,
            } = face;

            const surface = get(surfaceStore(surfaceId));
            if (surface.type !== "Quad") {
                log.warn(`Raycast hit a non-quad surface '${surfaceId}' (type: ${surface.type})`);
                return { type: "Nothing" };
            }

            const { vertices } = get(surfaceGeometryStore(surfaceId))
            
            const hitVertices = [a, b, c].map(index => {
                    const local = vertices[index];
                    const world = object.localToWorld(new THREE.Vector3(local[0], local[1], 0));

                    const distance = world.distanceToSquared(point);

                    return { index, distance };
                })
                .filter(d => d.distance <= selectionThreshold * selectionThreshold)
                .sort((a, b) => a.distance - b.distance)
                .map(d => d.index);
            
            log.debug(hitVertices);

            if (hitVertices.length > 0) {
                return {
                    type: "Vertex",
                    surfaceId,
                    surfaceType,
                    vertices: hitVertices,
                };
            }
        }


        return {
            type: "Surface",
            surfaceId,
            surfaceType,
        };
    }
}
