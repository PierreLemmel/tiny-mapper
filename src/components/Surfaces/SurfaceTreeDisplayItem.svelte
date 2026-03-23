<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';

    import GroupIcon from "../../icons/GroupIcon.svelte";
    import QuadIcon from "../../icons/QuadIcon.svelte";
    import { cn } from "../../lib/core/utils";
    import { content } from "../../lib/stores/content";
    import { surfaceUI } from "../../lib/stores/user-interface";
    import { longpress, type PointerModifiers } from "../../lib/ui/longpress-action";
    import NameDisplay from "../Shared/NameDisplay.svelte";
    import VisibleCheckbox from "../Shared/VisibleCheckbox.svelte";
    import {
        activeDragCompanions,
        applyFinalize,
        clearMultiDrag,
        startMultiDragIfNeeded,
        selectSurface,
        type SurfaceDisplayTreeItem,
    } from "./surface-tree";
    import { FLIP_DURATION_MS, SURFACES_DND_TARGET_CLASSES, SURFACES_DND_TARGET_STYLE, SURFACES_DND_TYPE } from '../../lib/ui/animations';

    export let item: SurfaceDisplayTreeItem;
    export let indent: number = 0;
    export let isParentDisabled: boolean = false;

    const INDENT_SIZE = 10;

    $: id = item.id;
    $: surface = $content.surfaces[id];
    $: type = surface?.type;
    $: selected = $surfaceUI.selectedSurfaces.includes(id);
    $: isDragCompanion = $activeDragCompanions.has(id);

    $: iconClasses = cn(
        "size-6 stroke-none fill-current",
        "transition-all duration-150",
        surface?.enabled
            ? (selected ? "text-primary-400" : "text-secondary-400")
            : "text-neutral-400",
    );

    let childItems: SurfaceDisplayTreeItem[] = [];
    let isChildDragging = false;

    $: if (!isChildDragging && type === "Group" && surface?.type === "Group") {
        childItems = surface.children.map((cid: string) => ({ id: cid }));
    }

    function handleChildConsider(e: CustomEvent<DndEvent<SurfaceDisplayTreeItem>>) {
        const { items: newItems, info } = e.detail;

        if (info.trigger === TRIGGERS.DRAG_STARTED) {
            startMultiDragIfNeeded(info.id);
        } else if (info.trigger === TRIGGERS.DRAG_STOPPED) {
            clearMultiDrag();
        }

        childItems = newItems;
        isChildDragging = info.trigger !== TRIGGERS.DRAG_STOPPED;
    }

    function handleChildFinalize(e: CustomEvent<DndEvent<SurfaceDisplayTreeItem>>) {
        const { items: newItems, info } = e.detail;
        childItems = newItems;
        isChildDragging = false;

        if (info.trigger !== TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
            applyFinalize(id, newItems, info.trigger, info.id);
        }

        clearMultiDrag();
    }

    function handleLongPress(modifiers: PointerModifiers) {
        if (!surface) return;
        selectSurface(id, modifiers);
    }
</script>

<div
    class={cn(
        "flex flex-row justify-between items-center h-6.5 transition-opacity duration-150",
        selected && "bg-primary-400/10",
        isDragCompanion && "opacity-25",
    )}
    use:longpress={{ onLongPress: handleLongPress }}
>
    {#if surface}
    <div
        class="flex flex-row items-center justify-start"
    >
        {#if type === "Group"}
            <GroupIcon className={iconClasses} />
        {:else if type === "Quad"}
            <QuadIcon className={iconClasses} strokeWidth={1.2} fillColor="none" />
        {/if}
        <NameDisplay
            bind:value={$content.surfaces[id].name}
            className={cn(surface?.enabled ? "text-neutral-100" : "text-neutral-300")}
        />
    </div>

    <div class="flex flex-row items-center justify-end">
        <VisibleCheckbox bind:visible={$content.surfaces[id].enabled} />
    </div>
    {/if}
</div>

{#if surface && type === "Group"}
<div
    class={cn(
        "flex flex-col items-stretch",
        "pl-3 border-l border-neutral-700",
    )}
    use:dndzone={{
        items: childItems,
        flipDurationMs: FLIP_DURATION_MS,
        type: SURFACES_DND_TYPE,
        dropTargetClasses: SURFACES_DND_TARGET_CLASSES,
        dropTargetStyle: SURFACES_DND_TARGET_STYLE
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
{/if}
