<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';

    import GroupIcon from "../../../icons/GroupIcon.svelte";
    import { cn } from "../../../lib/core/utils";
    import { eventStore } from "../../../lib/events/event-store";
    import { materialUI } from "../../../lib/stores/user-interface";
    import NameDisplay from "../../Shared/NameDisplay.svelte";

    import {
        activeDragCompanions,
        applyFinalize,
        clearMultiDrag,
        renameRequestId,
        startMultiDragIfNeeded,
        selectMaterial,
        toggleGroupCollapsed,
        type MaterialDisplayTreeItem,
    } from "./material-tree";
    import { FLIP_DURATION_MS, MATERIALS_DND_TARGET_CLASSES, MATERIALS_DND_TARGET_STYLE, MATERIALS_DND_TYPE } from '../../../lib/ui/animations';
    import ChevronIcon from '../../../icons/ChevronIcon.svelte';
    import { materialStore } from '../../../lib/stores/materials';
    import SolidColorIcon from '../../../icons/SolidColorIcon.svelte';
    import { rawColorToCssString } from '../../../lib/core/color';

    export let item: MaterialDisplayTreeItem;
    export let indent: number = 0;

    $: id = item.id;
    $: material = materialStore(id);
    $: type = $material?.type;
    $: selected = $materialUI.selectedMaterials.includes(id);
    $: isDragCompanion = $activeDragCompanions.has(id);
    $: collapsed = type === "Group" && $materialUI.collapsedGroups.includes(id);

    $: iconClasses = cn(
        "size-6",
        "transition-all duration-150",
        selected ? "text-primary-400" : "text-secondary-400",
    );

    let nameDisplay: NameDisplay;

    $: if ($renameRequestId === id && nameDisplay) {
        nameDisplay.startEditing();
        $renameRequestId = null;
    }

    let childItems: MaterialDisplayTreeItem[] = [];
    let isChildDragging = false;

    $: if (!isChildDragging && type === "Group" && $material.type === "Group") {
        childItems = $material.children.map((cid: string) => ({ id: cid }));
    }

    function handleChildConsider(e: CustomEvent<DndEvent<MaterialDisplayTreeItem>>) {
        const { items: newItems, info } = e.detail;

        if (info.trigger === TRIGGERS.DRAG_STARTED) {
            startMultiDragIfNeeded(info.id);
        } else if (info.trigger === TRIGGERS.DRAG_STOPPED) {
            clearMultiDrag();
        }

        childItems = newItems;
        isChildDragging = info.trigger !== TRIGGERS.DRAG_STOPPED;
    }

    function handleChildFinalize(e: CustomEvent<DndEvent<MaterialDisplayTreeItem>>) {
        const { items: newItems, info } = e.detail;
        childItems = newItems;
        isChildDragging = false;

        if (info.trigger !== TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
            applyFinalize(id, newItems, info.trigger, info.id);
        }

        clearMultiDrag();
    }

    function handleClick(e: MouseEvent) {
        if (!material) return;
        selectMaterial(id, { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, metaKey: e.metaKey });
    }
</script>

<div
    class={cn(
        "flex flex-row justify-between items-center h-6.5 transition-opacity duration-150",
        selected && "bg-primary-400/10",
        isDragCompanion && "opacity-25",
    )}
    on:dblclick|stopPropagation={handleClick}
    on:click|stopPropagation={handleClick}
    on:keydown
    role="treeitem"
    aria-selected={selected}
    tabindex="-1"
>
    {#if material}
    <div class={cn(
        "flex flex-row items-center justify-start",
        (type === "Group" && childItems.length > 0) && "-ml-2"
    )}>
        {#if type === "Group"}
            {#if childItems.length > 0}
            <button
                class="flex items-center justify-center size-4 shrink-0 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
                on:click|stopPropagation={() => toggleGroupCollapsed(id)}
                on:dblclick|stopPropagation={() => {}}
            >
                <ChevronIcon className={cn(
                    "size-3 transition-transform duration-150",
                    collapsed && "-rotate-90"
                )} />
            </button>
            {/if}

            <GroupIcon className={iconClasses} />
        {:else if type === "SolidColor"}
            <SolidColorIcon className={cn(iconClasses, "stroke-[1.5px]")} />
        {/if}
        <NameDisplay
            bind:this={nameDisplay}
            bind:value={$material.name}
            className={cn(
                selected ? "text-primary-200" : "text-neutral-200"
            )}
            onCommit={(oldVal, newVal) => eventStore.push({
                category: "Material", type: "NameChanged",
                forwardData: { materialId: id, name: newVal },
                backwardData: { materialId: id, name: oldVal },
            })}
        />
    </div>

    {#if $material.type === "SolidColor"}
    <div class="flex flex-row items-center justify-end pr-1">
        <div class="h-4 w-6.5 rounded-xs shrink-0" style="background: {rawColorToCssString($material.color)}"></div>
    </div>
    {/if}
    {/if}
</div>

{#if material && type === "Group"}
<div class={cn(
    "transition-all duration-300 ease-linear",
    "overflow-hidden",
    collapsed ? "h-0" : "h-auto"
)}>
    <div
        class={cn(
            "flex flex-col items-stretch",
            "pl-4 border-l border-neutral-700",
        )}
        use:dndzone={{
            items: childItems,
            flipDurationMs: FLIP_DURATION_MS,
            type: MATERIALS_DND_TYPE,
            dropTargetClasses: MATERIALS_DND_TARGET_CLASSES,
            dropTargetStyle: MATERIALS_DND_TARGET_STYLE
        }}
        on:consider={handleChildConsider}
        on:finalize={handleChildFinalize}
    >
        {#each childItems as child (child.id)}
        <div class="w-full flex flex-col items-stretch" animate:flip={{ duration: FLIP_DURATION_MS }}>
            <svelte:self item={child} indent={indent + 1} />
        </div>
        {/each}
    </div>
</div>
{/if}
