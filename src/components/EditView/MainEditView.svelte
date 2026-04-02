<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { MainScene } from "../../lib/rendering/main-scene";
    import { MainCamera } from "../../lib/rendering/main-camera";
    import { MainRenderer } from "../../lib/rendering/main-renderer";
    import { renderingUI } from "../../lib/stores/user-interface";
    import { cn } from "../../lib/core/utils";
    import { mainRendering } from "../../lib/stores/rendering";
    import { application } from "../../lib/stores/application";

    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;

    
    let rafId: number;
    let resizeObserver: ResizeObserver;

    const scene: MainScene = MainScene.instance();
    let camera: MainCamera|null = null;
    let renderer: MainRenderer|null = null;

    function resize(width: number, height: number) {
        camera?.resize(width, height);
        renderer?.resize(width, height);
    }

    let fps: number;
    let renderingTime: number;
    let timeBetweenFrames: number;
    let geometryCount: number;
    let textureCount: number;

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
        resize(width, height);

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
    <canvas bind:this={canvas} class="absolute inset-0 w-full h-full"></canvas>
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
