<script lang="ts">
    import { tick, onDestroy } from "svelte";
    import { get } from "svelte/store";
    import { cn } from "../../../lib/core/utils";
    import { MaterialTemplatePreviewScene } from "../../../lib/rendering/material-template-preview-scene";
    import { materialTemplateStore, materialTemplates } from "../../../lib/stores/material-templates";
    import { mainRenderer } from "../../../lib/stores/rendering";
    import { libraryUI } from "../../../lib/stores/user-interface";
    import { log } from "../../../lib/logging/logger";
    import { eventStore } from "../../../lib/events/event-store";
    import NameDisplay from "../../Shared/NameDisplay.svelte";
    import TagSelector from "../../Shared/TagSelector.svelte";
    import MultilineTextField from "../../Shared/MultilineTextField.svelte";
    import Foldable from "../../Shared/Foldable.svelte";
    import HorizontalSeparator from "../../Shared/HorizontalSeparator.svelte";
    import ShaderTestValuesEditor from "./ShaderTestValuesEditor.svelte";

    export let className: string | undefined = undefined;

    export let templateId: string;

    let canvas: HTMLDivElement | undefined;

    $: template = materialTemplateStore(templateId);

    $: allTags = (() => {
        const tags = new Set<string>();
        for (const t of Object.values($materialTemplates)) {
            if (t.tags) {
                for (const tag of t.tags) {
                    tags.add(tag);
                }
            }
        }
        return Array.from(tags).sort();
    })();

    const fieldLabelClasses = "text-[0.5625rem] font-medium tracking-widest uppercase text-neutral-500";

    const separatorClasses = "my-0";

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
        if (!canvas || scene) {
            return;
        }
        await tick();
        if (!canvas || scene) {
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

    $: {
        canvas;
        void trySetup();
    }

    $: if (!canvas) {
        teardown();
    }

    onDestroy(() => {
        teardown();
    });
</script>

<div class={cn(
    "panel flex flex-col items-stretch gap-2 py-2 px-2",
    "overflow-y-auto h-full min-h-0",
    className
)}>
    <Foldable title="Base Properties" bind:open={$libraryUI.shaders.baseProperties.open}>
        <div class="flex flex-col gap-2 min-w-0">
            <div class="flex flex-col gap-0.5 min-w-0">
                <span class={fieldLabelClasses}>Name</span>
                <NameDisplay
                    className="text-neutral-200 text-xs"
                    bind:value={$template.name}
                    onCommit={(oldVal, newVal) => {
                        eventStore.push({
                            category: "MaterialTemplate",
                            type: "NameChanged",
                            forwardData: { templateId, name: newVal },
                            backwardData: { templateId, name: oldVal },
                        });
                    }}
                />
            </div>
            <div class="flex flex-col gap-0.5 min-w-0">
                <span class={fieldLabelClasses}>Author</span>
                <NameDisplay
                    className="text-neutral-200 text-xs"
                    bind:value={$template.author}
                    onCommit={(oldVal, newVal) => {
                        eventStore.push({
                            category: "MaterialTemplate",
                            type: "AuthorChanged",
                            forwardData: { templateId, author: newVal },
                            backwardData: { templateId, author: oldVal },
                        });
                    }}
                />
            </div>
            <MultilineTextField
                label="Description"
                bind:value={$template.description}
                onCommit={(oldVal, newVal) => {
                    eventStore.push({
                        category: "MaterialTemplate",
                        type: "DescriptionChanged",
                        forwardData: { templateId, description: newVal },
                        backwardData: { templateId, description: oldVal },
                    });
                }}
            />
            <div class="flex flex-col gap-0.5 min-w-0">
                <span class={fieldLabelClasses}>Tags</span>
                <TagSelector
                    tags={$template.tags ?? []}
                    availableTags={allTags}
                    onChange={(oldTags, newTags) => {
                        $template.tags = newTags;
                        eventStore.push({
                            category: "MaterialTemplate",
                            type: "TagsChanged",
                            forwardData: { templateId, tags: newTags },
                            backwardData: { templateId, tags: oldTags },
                        });
                    }}
                />
            </div>
        </div>
    </Foldable>

    <HorizontalSeparator className={separatorClasses} />

    <Foldable title="Preview" bind:open={$libraryUI.shaders.preview.open}>
        <div
            class={cn(
                "w-full aspect-4/3 shrink-0",
                "rounded-sm",
                "ring-1 ring-neutral-700",
            )}
            bind:this={canvas}
        ></div>
    </Foldable>

    <HorizontalSeparator className={separatorClasses} />

    <Foldable title="Test Values" bind:open={$libraryUI.shaders.testValues.open}>
        <ShaderTestValuesEditor
            {templateId}
            uniforms={$template.uniforms}
            bind:values={$template.uniformsPreviewValues}
        />
    </Foldable>
</div>
