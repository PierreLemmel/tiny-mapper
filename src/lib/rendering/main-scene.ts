import * as THREE from "three";
import { get } from "svelte/store";
import { rootSurfaces } from "../stores/surfaces";
import { eventStore, type AppEvent } from "../events/event-store";
import { surfaceUI } from "../stores/user-interface";
import { log } from "../logging/logger";
import { MainOutliner } from "./main-outliner";
import { defaultHierarchyData, type GroupSurfaceRenderData, type QuadSurfaceRenderData } from "./main-scene-types";
import { MainSceneHandlesManager } from "./main-scene-handles-manager";
import { MainSceneHierarchyManager } from "./main-scene-hierarchy-manager";
import { MainSceneSelectionManager } from "./main-scene-selection-manager";

export class MainScene {
    private scene: THREE.Scene;

    private initialized = false;

    private quadSurfaceMap = new Map<string, QuadSurfaceRenderData>();
    private groupSurfaceMap = new Map<string, GroupSurfaceRenderData>();
    private root: THREE.Group = new THREE.Group();

    private selectionManager: MainSceneSelectionManager | null = null;
    private handlesManager: MainSceneHandlesManager | null = null;
    private hierarchyManager: MainSceneHierarchyManager | null = null;

    public outliner = new MainOutliner();

    private unsubscribes: (() => void)[] = [];

    public get content(): THREE.Scene {
        return this.scene;
    }

    private constructor() {
        this.scene = new THREE.Scene();
    }

    public initializeSceneIfNeeded() {
        if (this.initialized) {
            log.warn("Scene already initialized");
            return;
        }

        (window as any).mainScene = this;

        this.initialized = true;

        this.createRoot();

        this.selectionManager = new MainSceneSelectionManager(
            this.scene,
            this.quadSurfaceMap,
            this.groupSurfaceMap,
            this.outliner
        );
        this.selectionManager.initialize();

        this.handlesManager = new MainSceneHandlesManager(this.scene, this.quadSurfaceMap);
        this.handlesManager.initialize();

        this.hierarchyManager = new MainSceneHierarchyManager(
            this.root,
            this.quadSurfaceMap,
            this.groupSurfaceMap,
            {
                onUpdateSelection: () => this.selectionManager!.updateSelectionItems(),
                onUpdateHandles: () => this.handlesManager!.updateHandles(),
            }
        );

        const rootHierarchyData = defaultHierarchyData();
        this.groupSurfaceMap.set("root", {
            group: this.root,
            hierarchyData: rootHierarchyData,
            unsubscribe: () => {},
        });

        for (const rootId of get(rootSurfaces).children) {
            this.hierarchyManager.createSurface(this.root, rootHierarchyData, rootId);
        }

        this.hierarchyManager.sortSurfaces();

        eventStore.on("push", e => this.handleEvent(e));
        eventStore.on("undo", e => this.handleEvent(e));
        eventStore.on("redo", e => this.handleEvent(e));

        this.unsubscribes.push(
            surfaceUI.subscribe(() => {
                this.selectionManager!.updateSelectionItems();
                this.handlesManager!.updateHandles();
            })
        );
    }

    private createRoot() {
        this.root.name = "root";
        this.root.userData.id = "root";
        this.scene.add(this.root);
    }

    private handleEvent(event: AppEvent) {
        if (event.category !== "Surface") {
            return;
        }
        if (event.type === "TreeMoved" || event.type === "Deleted" || event.type === "Created") {
            this.hierarchyManager!.checkHierarchy();
            this.hierarchyManager!.sortSurfaces();
            this.selectionManager!.updateSelectionItems();
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
        for (const unsubscribe of this.unsubscribes) {
            unsubscribe();
        }
        this.unsubscribes.length = 0;

        this.selectionManager?.dispose();
        this.selectionManager = null;

        this.handlesManager?.dispose();
        this.handlesManager = null;

        this.hierarchyManager = null;

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
