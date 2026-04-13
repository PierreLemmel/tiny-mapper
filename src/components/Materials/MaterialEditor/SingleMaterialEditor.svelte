<script lang="ts">
    import GroupIcon from "../../../icons/GroupIcon.svelte";
    import { cn } from "../../../lib/core/utils";
    import type { Material } from "../../../lib/logic/materials/materials";
    import { eventStore } from "../../../lib/events/event-store";
    import NameDisplay from "../../Shared/NameDisplay.svelte";
    import SolidColorIcon from "../../../icons/SolidColorIcon.svelte";
    import HorizontalSeparator from "../../Shared/HorizontalSeparator.svelte";
    import Foldable from "../../Shared/Foldable.svelte";
    import { materialUI } from "../../../lib/stores/user-interface";
    import FoldableColorPicker from "../../Shared/FoldableColorPicker.svelte";
    import { rawColorToCssString } from "../../../lib/core/color";
    import TextureIcon from "../../../icons/TextureIcon.svelte";

    export let className: string|undefined = undefined;

    export let material: Material;

    $: iconClasses = cn(
        "size-6",
        "transition-all duration-150",
        "text-primary-400",
    );

    const separatorClasses = "my-0";

    let newTagInput = "";

    $: currentTags = material.tags ?? [];

    function addTag() {
        const tag = newTagInput.trim();
        if (tag.length === 0) return;
        if (currentTags.includes(tag)) {
            newTagInput = "";
            return;
        }
        const oldTags = [...currentTags];
        const newTags = [...currentTags, tag];
        material.tags = newTags;
        newTagInput = "";
        eventStore.push({
            category: "Material", type: "TagsChanged",
            forwardData: { materialId: material.id, tags: newTags },
            backwardData: { materialId: material.id, tags: oldTags },
        });
    }

    function removeTag(tag: string) {
        const oldTags = [...currentTags];
        const newTags = currentTags.filter(t => t !== tag);
        material.tags = newTags;
        eventStore.push({
            category: "Material", type: "TagsChanged",
            forwardData: { materialId: material.id, tags: newTags },
            backwardData: { materialId: material.id, tags: oldTags },
        });
    }

    function handleTagKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag();
        }
    }
</script>

<div class={cn(
    "flex flex-col gap-2 items-stretch w-full py-2 mb-4",
    className
)}>
    <div class={cn(
        "flex flex-row items-end justify-between w-full gap-1.5 mb-3",
    )}>
        {#if material.type === "Group"}
            <GroupIcon className={cn(iconClasses, "p-0.5")} />
        {:else if material.type === "SolidColor"}
            <SolidColorIcon className={cn(iconClasses, "stroke-[1.5px]")} />
        {:else if material.type === "Material"}
            <TextureIcon className={cn(iconClasses)} />
        {/if}
        <NameDisplay
            bind:value={material.name}
            className="text-neutral-200"
            onCommit={(oldVal, newVal) => eventStore.push({
                category: "Material", type: "NameChanged",
                forwardData: { materialId: material.id, name: newVal },
                backwardData: { materialId: material.id, name: oldVal },
            })}
        />
        {#if material.type === "SolidColor"}
        <div class="flex flex-row items-center justify-end pr-1">
            <div class="h-4 w-6.5 rounded-xs shrink-0" style="background: {rawColorToCssString(material.color)}"></div>
        </div>
        {/if}
    </div>

    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Base Properties" bind:open={$materialUI.baseProperties.open}>
        <div class="flex flex-col gap-2.5">
            {#if material.type === "SolidColor"}
            <FoldableColorPicker
                title="Color"
                bind:value={material.color}
                bind:open={$materialUI.baseProperties.colorOpen}
                bind:mode={$materialUI.baseProperties.colorColorMode}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Material", type: "ColorChanged",
                    forwardData: { materialId: material.id, color: newVal },
                    backwardData: { materialId: material.id, color: oldVal },
                })}
            />
            {/if}
        </div>
    </Foldable>

    <HorizontalSeparator className={separatorClasses} />
    <div class="flex flex-col gap-2 px-0.5">
        <div class="text-[0.625rem] font-medium uppercase tracking-wider text-neutral-400">Tags</div>
        {#if currentTags.length > 0}
        <div class="flex flex-row flex-wrap gap-1.5">
            {#each currentTags as tag}
            <span class={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
                "bg-neutral-800 text-neutral-300 text-[0.625rem] font-medium uppercase tracking-wider",
                "border border-neutral-700"
            )}>
                {tag}
                <button
                    class="inline-flex items-center justify-center size-3 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                    on:click={() => removeTag(tag)}
                    aria-label="Remove tag {tag}"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="size-full">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </span>
            {/each}
        </div>
        {/if}
        <div class="flex flex-row gap-1.5 items-center">
            <input
                type="text"
                placeholder="Add tag..."
                bind:value={newTagInput}
                on:keydown={handleTagKeydown}
                class={cn(
                    "flex-1 min-w-0 px-2.5 py-1 rounded-md",
                    "bg-neutral-800 border border-transparent",
                    "text-xs text-neutral-200 placeholder:text-neutral-500",
                    "focus:outline-none focus:border-secondary-500/40",
                    "transition-colors duration-150"
                )}
            />
            <button
                class={cn(
                    "inline-flex items-center justify-center size-6 rounded-sm",
                    "bg-primary-400 text-neutral-950 cursor-pointer",
                    "hover:bg-primary-300 active:bg-primary-400",
                    "transition-all duration-150",
                    newTagInput.trim().length === 0 && "opacity-40 pointer-events-none"
                )}
                on:click={addTag}
                disabled={newTagInput.trim().length === 0}
                aria-label="Add tag"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="size-3.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
            </button>
        </div>
    </div>
</div>