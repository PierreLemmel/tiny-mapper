<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { MainScene } from "../../lib/rendering/main-scene";
    import { MainCamera, ZOOM_FACTOR, MIN_ZOOM, MAX_ZOOM } from "../../lib/rendering/main-camera";
    import { MainRenderer } from "../../lib/rendering/main-renderer";
    import { renderingUI } from "../../lib/stores/user-interface";
    import { cn, remap } from "../../lib/core/utils";
    import { mainRendering } from "../../lib/stores/rendering";
    import { application } from "../../lib/stores/application";
    import { dragOrClick, type DistinctEvent } from "../../lib/ui/actions/dragOrClick";
    import { MainRaycaster } from "../../lib/rendering/main-raycaster";
    import type { SurfaceType } from "../../lib/logic/surfaces/surfaces";
    import { clearSelection, selectSurface, type SelectSurfaceModifiers } from "../../lib/logic/surfaces/surface-selection";

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
                handleNothingClick(modifiers);
                break;
            case "Surface":
                handleSurfaceClick(intersects.surfaceId, intersects.surfaceType, modifiers);
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
        selectSurface(surfaceId, modifiers, { allowShiftAnchoring: false });
    }

    function handleDragStart(e: DistinctEvent) {
        isDragging = true;
    }

    function handleDragMove(e: DistinctEvent) {
    }

    function handleDragEnd(e: DistinctEvent) {
        isDragging = false;
    }

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

            if (!renderer || !camera) return;

            renderer.render(scene, camera);
        }
        loop();

        return () => {
            canvas.removeEventListener("wheel", onWheel);
        };
    });

    $: if ($application.loaded) {
        scene.initializeSceneIfNeeded();
    }
    
    onDestroy(() => {
        cancelAnimationFrame(rafId);
        resizeObserver?.disconnect();

        camera?.dispose();
        renderer?.dispose();
    });
</script>

<div bind:this={container} class="flex flex-col w-full h-full min-w-0 min-h-0 relative">
    <canvas
        bind:this={canvas}
        class="absolute inset-0 w-full h-full"
        class:cursor-grabbing={isDragging}
        use:dragOrClick
        on:distinctClick={(e) => handleClick(e.detail)}
        on:distinctDragStart={(e) => handleDragStart(e.detail)}
        on:distinctDragMove={(e) => handleDragMove(e.detail)}
        on:distinctDragEnd={(e) => handleDragEnd(e.detail)}
        on:dblclick|preventDefault
    ></canvas>
    {#if $renderingUI.statsDisplay}
        <div class={cn(
            "w-65",
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
