import * as THREE from "three";
import type { MainCamera } from "./main-camera";
import type { MainScene } from "./main-scene";
import { RenderingLayers } from "./rendering-layers";
import type { SurfaceType } from "../logic/surfaces/surfaces";
import { get } from "svelte/store";
import { surfaceStore } from "../stores/surfaces";
import { log } from "../logging/logger";
import { mainRendering } from "../stores/rendering";
import { uiSettings } from "../stores/settings";
import type { MainSceneHandlePickEntry } from "./main-scene-types";

export type RaycastResult =
    | {
          type: "Nothing";
      }
    | {
          type: "Surface";
          surfaceId: string;
          surfaceType: SurfaceType;
      }
    | {
          type: "Handle";
          surfaceId: string;
          surfaceType: SurfaceType;
          vertices: number[];
      };

export class MainRaycaster {
    private raycaster: THREE.Raycaster;

    private _camera: MainCamera;
    private _scene: MainScene;

    public constructor(camera: MainCamera, scene: MainScene) {
        this._camera = camera;
        this._scene = scene;

        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.enable(RenderingLayers.SURFACES);
        this.raycaster.layers.enable(RenderingLayers.HANDLES);
    }

    public castRay(ndcX: number, ndcY: number): RaycastResult {
        const zoom = get(mainRendering).zoom;
        const handlesSize = get(uiSettings).handlesSize;
        this.raycaster.params.Points.threshold = (handlesSize * 0.5) / zoom;

        this.raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this._camera.camera);

        const intersects = this.raycaster.intersectObjects(this._scene.content.children);

        const handlePickList = intersects.filter(
            (i): i is THREE.Intersection & { index: number } =>
                i.index !== undefined &&
                Array.isArray((i.object as THREE.Object3D).userData.handlePick)
        );

        if (handlePickList.length > 0) {
            handlePickList.sort(
                (a, b) => (a.distanceToRay ?? Infinity) - (b.distanceToRay ?? Infinity)
            );
            const hit = handlePickList[0];
            const pick = (hit.object.userData.handlePick as MainSceneHandlePickEntry[])[hit.index];
            const surface = get(surfaceStore(pick.surfaceId));
            if (surface.type !== "Quad") {
                log.warn(`Handle pick referred to non-quad surface '${pick.surfaceId}' (type: ${surface.type})`);
                return { type: "Nothing" };
            }
            return {
                type: "Handle",
                surfaceId: pick.surfaceId,
                surfaceType: surface.type,
                vertices: [pick.vertexIndex],
            };
        }

        if (intersects.length === 0) {
            return { type: "Nothing" };
        }

        const { object } = intersects[0];

        const surfaceId = object.userData.id;
        const surfaceType = object.userData.type as SurfaceType;

        return {
            type: "Surface",
            surfaceId,
            surfaceType,
        };
    }


    public dispose() {
        
    }
}
