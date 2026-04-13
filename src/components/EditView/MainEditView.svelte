<script lang="ts">
    import { onMount } from "svelte";
    import { MainScene } from "../../lib/rendering/main-scene";
    import { MainCamera, ZOOM_FACTOR, MIN_ZOOM, MAX_ZOOM } from "../../lib/rendering/main-camera";
    import { MainRenderer } from "../../lib/rendering/main-renderer";
    import { renderingUI, surfaceUI, type SurfaceUIData } from "../../lib/stores/user-interface";
    import { cn, remap } from "../../lib/core/utils";
    import { mainRendering } from "../../lib/stores/rendering";
    import { application } from "../../lib/stores/application";
    import { dragOrClick, type DistinctEvent } from "../../lib/ui/actions/dragOrClick";
    import { MainRaycaster } from "../../lib/rendering/main-raycaster";
    import type { SurfaceType } from "../../lib/logic/surfaces/surfaces";
    import { belongsToCurrentSelection, clearSelection, selectSurface, topLevelSelectedSurfaces, type SelectSurfaceModifiers } from "../../lib/logic/surfaces/surface-selection";
    import { InputContexts } from "../../lib/ui/inputs/input-contexts";
    import { inputContext } from "../../lib/ui/actions/inputContext";
    import { registerMainEditViewHandlers, unregisterMainEditViewHandlers } from "../../lib/ui/inputs/rendering/main-edit-view-handlers";
    import { inputManager } from "../../lib/ui/inputs/input-manager";
    import type { Position } from "../../lib/logic/mapping";
    import { clearAllSelectedHandles, clearSelectedHandlesForSurfaces, selectSurfaceHandles, surfaceHasHandlesSelected, translateSelectedHandles, translateSelectedSurfaces } from "../../lib/logic/surfaces/surface-edit";
    import { uiSettings } from "../../lib/stores/settings";
    import { surfaceGeometryStore, surfaceStore } from "../../lib/stores/surfaces";
    import { get } from "svelte/store";
    import type { SurfaceGeometryVertexChangedEventData, SurfacesTranslatedEventData } from "../../lib/events/surfaces/surfaces-event-types";
    import { eventStore } from "../../lib/events/event-store";

    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;

    
    let rafId: number;
    let resizeObserver: ResizeObserver;

    const scene: MainScene = MainScene.instance();
    let camera: MainCamera|null = null;
    let renderer: MainRenderer|null = null;
    let raycaster: MainRaycaster|null = null;

    let canvasWidth = 1;
    let canvasHeight = 1;

    function resize(width: number, height: number) {
        canvasWidth = width;
        canvasHeight = height;
        camera?.resize(width, height);
        renderer?.resize(width, height);
    }

    let fps: number;
    let renderingTime: number;
    let timeBetweenFrames: number;
    let geometryCount: number;
    let textureCount: number;

    let isDragging = false;


    function handleClick(e: DistinctEvent) {

        if (!camera || !raycaster) return;

        const {
            ctrlKey,
            shiftKey,
            metaKey,
            x,
            y,
        } = e;

        const ndcX = remap(x, 0, canvasWidth, -1, 1);
        const ndcY = remap(y, 0, canvasHeight, 1, -1);

        const intersects = raycaster.castRay(ndcX, ndcY);
        const modifiers: SelectSurfaceModifiers = { ctrlKey, shiftKey, metaKey };
        
        switch (intersects.type) {
            case "Nothing":
                if (!hasInterractedWithWindow) return;
                handleNothingClick(modifiers);
                break;
            case "Surface":
                handleSurfaceClick(intersects.surfaceId, intersects.surfaceType, modifiers);
                break;
            case "Handle":
                handleVertexClick(intersects.surfaceId, intersects.surfaceType, intersects.vertices, modifiers);
                break;
        }
    }

    function handleNothingClick(modifiers: SelectSurfaceModifiers) {
        if (modifiers.ctrlKey || modifiers.metaKey) {
            return;
        }
        clearSelection();
    }

    function handleSurfaceClick(surfaceId: string, surfaceType: SurfaceType, modifiers: SelectSurfaceModifiers) {
        if (surfaceHasHandlesSelected(surfaceId)) {
            clearSelectedHandlesForSurfaces([surfaceId]);
            updateTranslationType($surfaceUI);
        }
        else {
            selectSurface(surfaceId, modifiers, { allowShiftAnchoring: false });
        }
    }

    function handleVertexClick(surfaceId: string, surfaceType: SurfaceType, vertices: number[], modifiers: SelectSurfaceModifiers) {
        if (!belongsToCurrentSelection(surfaceId)) {
            selectSurface(surfaceId, modifiers, { allowShiftAnchoring: false });
        }
        
        const mode = (modifiers.ctrlKey || modifiers.metaKey || modifiers.shiftKey) ? "Toggle" : "Replace";
        selectSurfaceHandles([{ surfaceId, handles: vertices }], mode);
    }

    let isDraggingSurfaces = false;
    let dragPrevCanvasX = 0;
    let dragPrevCanvasY = 0;
    let dragTranslationType: TranslationType = "None";

    function handleDragStart(e: DistinctEvent) {
        if (!camera || !raycaster) return;

        const ndcX = remap(e.x, 0, canvasWidth, -1, 1);
        const ndcY = remap(e.y, 0, canvasHeight, 1, -1);
        const rcResult = raycaster.castRay(ndcX, ndcY);

        const modifiers: SelectSurfaceModifiers = {
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
        };

        switch (rcResult.type) {
            case "Nothing":
                handleNothingClick(modifiers);
                return;
            case "Handle":
                if (!belongsToCurrentSelection(rcResult.surfaceId)) {
                    selectSurface(rcResult.surfaceId, modifiers, { allowShiftAnchoring: false });
                }
                const handleMode = modifiers.ctrlKey || modifiers.metaKey || modifiers.shiftKey ? "Toggle" : "Replace";
                selectSurfaceHandles([{ surfaceId: rcResult.surfaceId, handles: rcResult.vertices }], handleMode);
                updateTranslationType($surfaceUI);
                break;
            case "Surface":
                const hitSurfaceId = rcResult.surfaceId;

                if (!belongsToCurrentSelection(hitSurfaceId)) {
                    selectSurface(hitSurfaceId, modifiers, { allowShiftAnchoring: false });
                }

                if (!(modifiers.ctrlKey || modifiers.metaKey || modifiers.shiftKey)) {
                    clearAllSelectedHandles();
                }
                updateTranslationType($surfaceUI);
                break;
        }
        isDragging = true;
        if (translationType === "Surfaces" || translationType === "Handles") {
            isDraggingSurfaces = true;
            dragTranslationType = translationType;
            startTranslation(translationType);
            dragPrevCanvasX = e.x;
            dragPrevCanvasY = e.y;
        } else {
            isDraggingSurfaces = false;
        }
    }

    function handleDragMove(e: DistinctEvent) {
        if (!isDraggingSurfaces) return;
        const zoom = $mainRendering.zoom;
        const dx = e.x - dragPrevCanvasX;
        const dy = e.y - dragPrevCanvasY;
        dragPrevCanvasX = e.x;
        dragPrevCanvasY = e.y;
        if (dragTranslationType === "Handles") {
            translateSelectedHandles([dx / zoom, -dy / zoom]);
        } else {
            translateSelectedSurfaces([dx / zoom, -dy / zoom]);
        }
    }

    function handleDragEnd(e: DistinctEvent) {
        isDragging = false;
        if (isDraggingSurfaces) {
            doneTranslating(dragTranslationType);
            isDraggingSurfaces = false;
        }
    }

    let isTranslatingLeft = false;
    let isTranslatingRight = false;
    let isTranslatingUp = false;
    let isTranslatingDown = false;

    let isTranslating = false;
    let stopTranslationTimeout: number | null = null;

    const TRANSLATION_TIMEOUT = 200;

    $: {
        if (!isTranslatingLeft && !isTranslatingRight && !isTranslatingUp && !isTranslatingDown) {
            stopTranslationTimeout = setTimeout(() => {
                isTranslating = false;
                stopTranslationTimeout = null;
            }, TRANSLATION_TIMEOUT);
        }
        else {
            isTranslating = true;
            if (stopTranslationTimeout) {
                clearTimeout(stopTranslationTimeout);
                stopTranslationTimeout = null;
            }
        }
    }

    let storedData: Map<string, { position: Position }> = new Map();
    let storedHandleData: Map<string, Map<number, Position>> = new Map();
    type TranslationType = "None"|"Surfaces"|"Handles";

    let previousTranslationType: TranslationType = "None";
    let translationType: TranslationType = "None";

    function updateTranslationType(surfaceUIData: SurfaceUIData) {
        const hasSelectedHandles = Object.values(surfaceUIData.selectedHandles).some(h => h.length > 0);
        if (hasSelectedHandles && surfaceUIData.selectedSurfaces.length > 0) {
            translationType = "Handles";
        }
        else if ($surfaceUI.selectedSurfaces.length > 0) {
            translationType = "Surfaces";
        }
    }
    $: updateTranslationType($surfaceUI);
    let keyboardTranslationInterrupted = false;

    function stopKeyboardTranslationOnSelectionChange(surfaces: string[]) {
        if (!mounted) return;

        if (isTranslating) {
            doneTranslating(previousTranslationType);
            keyboardTranslationInterrupted = true;
        }

        previousTranslationType = translationType;
    }
    $: stopKeyboardTranslationOnSelectionChange($surfaceUI.selectedSurfaces);

    function handleArrowLeftDown() {
        handleKeyboardTranslation("left");
        isTranslatingLeft = true;
    }
    function handleArrowLeftUp() {
        isTranslatingLeft = false;
    }
    function handleArrowRightDown() {
        handleKeyboardTranslation("right");
        isTranslatingRight = true;
    }
    function handleArrowRightUp() {
        isTranslatingRight = false;
    }
    function handleArrowUpDown() {
        handleKeyboardTranslation("up");
        isTranslatingUp = true;
    }
    function handleArrowUpUp() {
        isTranslatingUp = false;
    }
    function handleArrowDownDown() {
        handleKeyboardTranslation("down");
        isTranslatingDown = true;
    }
    function handleArrowDownUp() {
        isTranslatingDown = false;
    }

    function startTranslation(type: TranslationType) {
        switch (type) {
            case "Surfaces":
                {
                    storedData.clear();
                    for (const surface of $topLevelSelectedSurfaces) {
                        storedData.set(surface, {
                            position: [...get(surfaceStore(surface)).transform.position]
                        });
                    }
                }
                break;

            case "Handles":
                {
                    storedHandleData.clear();
                    for (const [surfaceId, handles] of Object.entries($surfaceUI.selectedHandles)) {
                        if (handles.length === 0) continue;
                        const geom = get(surfaceGeometryStore(surfaceId));
                        const handleMap = new Map<number, Position>();
                        for (const handleIndex of handles) {
                            handleMap.set(handleIndex, [...geom.vertices[handleIndex]] as Position);
                        }
                        storedHandleData.set(surfaceId, handleMap);
                    }
                }
                break;

            case "None":
                break;
        }
    }

    function handleKeyboardTranslation(direction: "left" | "right" | "up" | "down") {
        if (keyboardTranslationInterrupted) return;

        const speed = $uiSettings.arrowTranslationSpeed / $mainRendering.zoom;

        const deltaX = direction === "left" ? -speed : direction === "right" ? speed : 0;
        const deltaY = direction === "up" ? speed : direction === "down" ? -speed : 0;

        if (translationType === "Handles") {
            translateSelectedHandles([deltaX, deltaY]);
        } else {
            translateSelectedSurfaces([deltaX, deltaY]);
        }
    }

    function doneTranslating(type: TranslationType) {
        
        switch (type) {
            case "Surfaces":
                {
                    const forwardData: SurfacesTranslatedEventData = {
                        data: $topLevelSelectedSurfaces.map(surfaceId => ({
                            surfaceId,
                            position: [...get(surfaceStore(surfaceId)).transform.position],
                        })),
                    };
                    const backwardData: SurfacesTranslatedEventData = {
                        data: [...storedData.entries()].map(([surfaceId, { position }]) => ({
                            surfaceId,
                            position: [...position],
                        })),
                    }

                    eventStore.push({
                        category: "Surface",
                        type: "Translated",
                        forwardData,
                        backwardData,
                    });
                }
                break;

            case "Handles":
                {
                    for (const [surfaceId, handleMap] of storedHandleData.entries()) {
                        const handles = Array.from(handleMap.keys());
                        const geom = get(surfaceGeometryStore(surfaceId));

                        const forwardData: SurfaceGeometryVertexChangedEventData = {
                            surfaceId,
                            vertices: handles.map(index => ({
                                index,
                                value: [...geom.vertices[index]] as Position,
                            })),
                        };
                        const backwardData: SurfaceGeometryVertexChangedEventData = {
                            surfaceId,
                            vertices: handles.map(index => ({
                                index,
                                value: [...handleMap.get(index)!] as Position,
                            })),
                        };

                        eventStore.push({
                            category: "Surface",
                            type: "GeometryVertexChanged",
                            forwardData,
                            backwardData,
                        });
                    }
                }
                break;

            case "None":
                break;
        }
    }

    function startAndStopTranslationEffect(translate: boolean) {
        if (!mounted) return;

        if (translate) {
            startTranslation(translationType);
        }
        else {
            if (!keyboardTranslationInterrupted) {
                doneTranslating(translationType);
            }
        }

        keyboardTranslationInterrupted = false;
    }
    $: startAndStopTranslationEffect(isTranslating);

    let mounted = false;
    let hasInterractedWithWindow = false;
    onMount(() => {
        
        resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                resize(width, height);
            }
        });
        resizeObserver.observe(container);
        
        const { width, height } = container.getBoundingClientRect();

        camera = new MainCamera(width, height);
        renderer = new MainRenderer(canvas);
        raycaster = new MainRaycaster(camera, scene);

        renderer.initialize(scene, camera, [width, height]);
        resize(width, height);

        function onWheel(e: WheelEvent) {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            mainRendering.update(r => {
                const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM,
                    e.deltaY < 0 ? r.zoom * ZOOM_FACTOR : r.zoom / ZOOM_FACTOR
                ));
                const nx = mouseX / canvasWidth;
                const ny = mouseY / canvasHeight;
                return {
                    position: [
                        r.position[0] + (nx - 0.5) * canvasWidth * (1 / r.zoom - 1 / newZoom),
                        r.position[1] + (0.5 - ny) * canvasHeight * (1 / r.zoom - 1 / newZoom),
                    ],
                    zoom: newZoom,
                };
            });
        }
        canvas.addEventListener("wheel", onWheel, { passive: false });

        setInterval(() => {
            if (!renderer) return;

            fps = renderer.fps;
            renderingTime = renderer.renderingTime;
            timeBetweenFrames = renderer.timeBetweenFrames;
            geometryCount = renderer.geometryCount;
            textureCount = renderer.textureCount;
        }, 200);
        
        function loop() {
            rafId = requestAnimationFrame(loop);

            if (!renderer) return;

            renderer.render();
        }
        loop();

        registerMainEditViewHandlers();

        const unregisters = [
            inputManager.registerKeyboardHandler("MainEditView", "ArrowUp", handleArrowUpDown, handleArrowUpUp),
            inputManager.registerKeyboardHandler("MainEditView", "ArrowDown", handleArrowDownDown, handleArrowDownUp),
            inputManager.registerKeyboardHandler("MainEditView", "ArrowLeft", handleArrowLeftDown, handleArrowLeftUp),
            inputManager.registerKeyboardHandler("MainEditView", "ArrowRight", handleArrowRightDown, handleArrowRightUp),
        ]

        mounted = true;

        return () => {
            canvas.removeEventListener("wheel", onWheel);
            unregisterMainEditViewHandlers();
            
            unregisters.forEach(unregister => unregister());

            cancelAnimationFrame(rafId);
            resizeObserver?.disconnect();

            camera?.dispose();
            renderer?.dispose();
        };
    });

    $: if ($application.loaded) {
        scene.initializeSceneIfNeeded();
    }

</script>

<div bind:this={container} class="panel flex flex-col w-full h-full min-w-0 min-h-0 relative">
    <canvas
        bind:this={canvas}
        class="absolute inset-0 w-full h-full focus:outline-none focus-visible:outline-none"
        class:cursor-grabbing={isDragging}
        use:inputContext={InputContexts.MainEditView}
        use:dragOrClick
        on:click={() => hasInterractedWithWindow = true}
        on:mouseleave={() => hasInterractedWithWindow = false}
        on:distinctClick={(e) => handleClick(e.detail)}
        on:distinctDragStart={(e) => handleDragStart(e.detail)}
        on:distinctDragMove={(e) => handleDragMove(e.detail)}
        on:distinctDragEnd={(e) => handleDragEnd(e.detail)}
        on:dblclick|preventDefault
    ></canvas>
    {#if $renderingUI.statsDisplay}
        <div class={cn(
            "panel w-65",
            "absolute top-0 right-0 z-10 bg-neutral-800/50",
            "grid grid-cols-[auto_auto] gap-2",
            "px-4 py-2 rounded-bl-sm",
            "text-xs text-neutral-200"
        )}>
            <div class="justify-self-start">FPS:</div>
            <div class="justify-self-end">{fps?.toFixed(1)}</div>

            <div class="justify-self-start">Rendering Time:</div>
            <div class="justify-self-end">{renderingTime?.toFixed(2)}ms</div>

            <div class="justify-self-start">Time Between Frames:</div>
            <div class="justify-self-end">{timeBetweenFrames?.toFixed(2)}ms</div>

            <div class="justify-self-start">Rendering percentage:</div>
            <div class="justify-self-end">{((renderingTime / timeBetweenFrames) * 100).toFixed(2)}%</div>

            <div class="justify-self-start">Geometry:</div>
            <div class="justify-self-end">{geometryCount}</div>

            <div class="justify-self-start">Texture:</div>
            <div class="justify-self-end">{textureCount}</div>

            <div class="justify-self-start">Selected Handles:</div>
            <div class="justify-self-end">{JSON.stringify($surfaceUI.selectedHandles)}</div>
        </div>
    {/if}

    <div class={cn(
        "w-45",
        "absolute bottom-0 left-0 z-10 bg-neutral-800/50",
        "grid grid-cols-[auto_auto] gap-2",
        "px-4 py-2 rounded-tr-sm",
        "text-xs text-neutral-200"
    )}>
        <div class="justify-self-start">Camera:</div>
        <div class="justify-self-end">{$mainRendering.position[0].toFixed(2)}, {$mainRendering.position[1].toFixed(2)}</div>
        
        <div class="justify-self-start">Zoom:</div>
        <div class="justify-self-end">{$mainRendering.zoom.toFixed(2)}</div>
    </div>
</div>
