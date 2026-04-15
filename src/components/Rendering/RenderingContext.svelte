<script lang="ts">
    import { onMount } from "svelte";
    import { cn } from "../../lib/core/utils";
    import { MainRenderer } from "../../lib/rendering/main-renderer";

    export let className: string|undefined = undefined;

    let container: HTMLDivElement;
    let canvas: HTMLCanvasElement;
    let rafId: number;

    let renderer: MainRenderer|null = null;

    function resize(width: number, height: number) {
        // canvasWidth = width;
        // canvasHeight = height;
        // camera?.resize(width, height);
        renderer?.resize(width, height);
    }

    let mounted = false;
    onMount(() => {

        const resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                resize(width, height);
            }
        });
        resizeObserver.observe(container);

        renderer = new MainRenderer(canvas);

        function renderLoop() {
            rafId = requestAnimationFrame(renderLoop);
        }
        rafId = requestAnimationFrame(renderLoop);

        mounted = true;

        return () => {
            cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
        }
    });

</script>

<div bind:this={container} class={cn(
    "panel flex flex-col w-full h-full min-w-0 min-h-0 relative",
    className
)}>
    <canvas bind:this={canvas} class="absolute inset-0 w-full h-full focus:outline-none focus-visible:outline-none"></canvas>
</div>