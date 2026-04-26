<script lang="ts">
    import { tick, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import { cn } from "../../lib/core/utils";
    import { MaterialTemplatePreviewScene } from "../../lib/rendering/material-template-preview-scene";
    import { mainRenderer } from "../../lib/stores/rendering";
    import { log } from "../../lib/logging/logger";

    export let name: string = "";
    export let templateId: string | undefined = undefined;
    export let className: string | undefined = undefined;

    export let selected: boolean = false;

    let canvas: HTMLDivElement | undefined;

    let scene: MaterialTemplatePreviewScene | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let renderingItemId: string | undefined;

    function initials(n: string): string {
        return n.split(/[_\-\s]+/).map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
    }

    $: {
        if (templateId) {
            scene?.targetTemplate(templateId);
        }
    }

    function teardown() {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = undefined;
        }
        if (renderingItemId) {
            get(mainRenderer)?.removeItemFromRendering(renderingItemId);
            renderingItemId = undefined;
        }
        scene?.dispose();
        scene = undefined;
    }

    async function trySetup() {
        if (!templateId || !canvas || scene) {
            return;
        }
        await tick();
        if (!templateId || !canvas || scene) {
            return;
        }

        scene = new MaterialTemplatePreviewScene(templateId);
        resizeObserver = new ResizeObserver((entries) => {
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                scene?.resize(width, height);
            }
        });
        resizeObserver.observe(canvas);

        const renderer = get(mainRenderer);
        if (renderer) {
            renderingItemId = renderer.addItemToRendering(
                scene.camera,
                scene.content,
                canvas,
                true
            );
        } else {
            log.error("MainRenderer not initialized");
        }
    }

    $: if (!templateId) {
        teardown();
    } else {
        canvas;
        void trySetup();
    }

    onDestroy(() => {
        teardown();
    });
</script>

{#if templateId}
    <div
        class={cn(
            "relative flex items-center justify-center overflow-hidden rounded-sm shrink-0",
            "bg-neutral-900/90 ring-1 ring-neutral-700/60",
            selected ? "ring-2 ring-secondary-400/70" : "",
            className
        )}
        aria-label={`Shader preview: ${name}`}
    >
        <div class="absolute inset-0 w-full h-full" bind:this={canvas}></div>
    </div>
{:else}
    <div class={cn(
        "relative flex items-center justify-center overflow-hidden rounded-sm shrink-0",
        "bg-linear-to-br from-violet-900 via-purple-800 to-indigo-900",
        selected ? "ring-2 ring-secondary-400/70" : "",
        className
    )}>
        <div class="absolute inset-0 opacity-30"
            style="background: radial-gradient(ellipse at 60% 40%, rgba(168,85,247,0.6) 0%, transparent 65%), radial-gradient(ellipse at 30% 70%, rgba(99,102,241,0.5) 0%, transparent 60%);"
        ></div>
        <span class="relative text-[0.6rem] font-semibold text-purple-200/80 select-none tracking-wider">
            {initials(name)}
        </span>
    </div>
{/if}
