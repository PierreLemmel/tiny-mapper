<script lang="ts">
    import { onMount } from "svelte";
    import { cn } from "../../lib/core/utils";
    import { MainRenderer } from "../../lib/rendering/main-renderer";
    import { compilationScene, mainCamera, mainRaycaster, mainRenderer, mainScene } from "../../lib/stores/rendering";
    import { MainCamera } from "../../lib/rendering/main-camera";
    import { MainScene } from "../../lib/rendering/main-scene";
    import { application } from "../../lib/stores/application";
    import { MainRaycaster } from "../../lib/rendering/main-raycaster";
    import { CompilationScene } from "../../lib/rendering/compilation-scene";

    export let className: string|undefined = undefined;

    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let rafId: number;

    function resize(width: number, height: number) {
        $mainCamera?.resize(width, height);
        $mainRenderer?.resize(width, height);
    }

    onMount(() => {

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                resize(width, height);
            }
        });
        resizeObserver.observe(container);

        const { width, height } = container.getBoundingClientRect();

        $mainCamera = new MainCamera(width, height);
        $mainScene = MainScene.instance();

        $mainRenderer = new MainRenderer(canvas);
        $mainRenderer.initialize();

        $compilationScene = new CompilationScene();
        $compilationScene.initialize();

        $mainRaycaster = new MainRaycaster($mainCamera, $mainScene);
        function loop() {
            rafId = requestAnimationFrame(loop);
            if (!$mainRenderer || !$mainCamera || !$mainScene) return;
            $mainRenderer.performRenderings();
        }

        loop();
        return () => {
            $mainCamera?.dispose();
            resizeObserver.disconnect();

            $mainScene?.dispose();
            $mainCamera?.dispose();
            $mainRenderer?.dispose();
            $mainRaycaster?.dispose();
            $compilationScene?.dispose();

            $mainScene = null;
            $mainCamera = null;
            $mainRenderer = null;
            $mainRaycaster = null;
            $compilationScene = null;
        }
    });

    $: if ($application.loaded) {
        $mainScene?.initializeSceneIfNeeded();
    }

</script>

<div bind:this={container} class={cn(
    "panel flex flex-col w-full h-full min-w-0 min-h-0 relative pointer-events-none",
    "z-100",
    className
)}>
    <canvas bind:this={canvas} class="absolute inset-0 w-full h-full focus:outline-none focus-visible:outline-none"></canvas>
</div>