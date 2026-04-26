<script lang="ts">
    import { tick, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import { cn } from "../../../lib/core/utils";
    import { MaterialTemplatePreviewScene } from "../../../lib/rendering/material-template-preview-scene";
    import { materialTemplateStore } from "../../../lib/stores/material-templates";
    import { mainRenderer } from "../../../lib/stores/rendering";
    import { libraryUI } from "../../../lib/stores/user-interface";
    import { log } from "../../../lib/logging/logger";
    import PlusIcon from "../../../icons/PlusIcon.svelte";
    import MinusIcon from "../../../icons/MinusIcon.svelte";

    export let className: string | undefined = undefined;

    export let templateId: string;

    let canvas: HTMLDivElement | undefined;

    $: template = materialTemplateStore(templateId);
    $: previewCollapsed = $libraryUI.shaders.previewCollapsed;

    let scene: MaterialTemplatePreviewScene | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let renderingItemId: string | undefined;

    $: {
        scene?.targetTemplate(templateId);
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
        if (previewCollapsed || !canvas || scene) {
            return;
        }
        await tick();
        if (previewCollapsed || !canvas || scene) {
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

    $: if (previewCollapsed) {
        teardown();
    } else {
        canvas;
        void trySetup();
    }

    onDestroy(() => {
        teardown();
    });

    function setPreviewCollapsed(v: boolean) {
        libraryUI.update((u) => ({
            ...u,
            shaders: { ...u.shaders, previewCollapsed: v },
        }));
    }
</script>

<div
    class={cn(
        "bg-neutral-600/80 rounded-md",
        "flex items-center flex-col",
        "py-1 px-2 gap-1",
        previewCollapsed ? "justify-center" : "items-center justify-center",
        className
    )}
>
    {#if previewCollapsed}
        <div class="w-full flex flex-row items-center justify-between gap-2 min-w-0">
            <div class="text-neutral-100/70 text-xs tracking-wider uppercase truncate">
                Preview: {$template?.name}
            </div>
            <button
                type="button"
                class="shrink-0 text-neutral-400 hover:text-neutral-100 p-0.5 rounded -mr-0.5"
                on:click={() => setPreviewCollapsed(false)}
                aria-label="Show preview"
            >
                <PlusIcon className="size-4" />
            </button>
        </div>
    {:else}
        <div class="w-full flex flex-row items-center justify-between gap-2 min-w-0">
            <div class="text-neutral-100/70 text-xs tracking-wider uppercase truncate">
                Preview: {$template?.name}
            </div>
            <button
                type="button"
                class="shrink-0 text-neutral-400 hover:text-neutral-100 p-0.5 rounded -mr-0.5"
                on:click={() => setPreviewCollapsed(true)}
                aria-label="Hide preview"
            >
                <MinusIcon className="size-4" />
            </button>
        </div>
        <div
            class={cn(
                "w-50 h-35",
                "rounded-sm",
                "ring-1 ring-neutral-400/70",
            )}
            bind:this={canvas}
        ></div>
    {/if}
</div>
