<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';

    import { cn } from "../../../lib/core/utils";
    import { surfaceUI } from "../../../lib/stores/user-interface";
    import {
        applyFinalize,
        clearMultiDrag,
        clearSelection,
        deleteSelectedSurfaces,
        renameRequestId,
        startMultiDragIfNeeded,
        type SurfaceDisplayTreeItem,
    } from "./surface-tree";
    import SurfaceTreeDisplayItem from "./SurfaceTreeDisplayItem.svelte";
    import { FLIP_DURATION_MS, SURFACES_DND_TARGET_CLASSES, SURFACES_DND_TARGET_STYLE, SURFACES_DND_TYPE } from '../../../lib/ui/animations';
    import { rootSurfaces } from '../../../lib/stores/surfaces';

    export let className: string | undefined = undefined;

    let items: SurfaceDisplayTreeItem[] = [];
    let isDragging = false;

    $: if (!isDragging) {
        items = $rootSurfaces.children.map(id => ({ id }));
    }

    function handleDndConsider(e: CustomEvent<DndEvent<SurfaceDisplayTreeItem>>) {
        const { items: newItems, info } = e.detail;

        if (info.trigger === TRIGGERS.DRAG_STARTED) {
            startMultiDragIfNeeded(info.id);
        } else if (info.trigger === TRIGGERS.DRAG_STOPPED) {
            clearMultiDrag();
        }

        items = newItems;
        isDragging = info.trigger !== TRIGGERS.DRAG_STOPPED;
    }

    function handleDndFinalize(e: CustomEvent<DndEvent<SurfaceDisplayTreeItem>>) {
        const { items: newItems, info } = e.detail;
        items = newItems;
        isDragging = false;

        if (info.trigger !== TRIGGERS.DROPPED_OUTSIDE_OF_ANY) {
            applyFinalize(null, newItems, info.trigger, info.id);
        }

        clearMultiDrag();
    }

    function handleBackgroundClick() {
        if (!isDragging) {
            clearSelection();
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        const target = e.target as HTMLElement;
        const isEditing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

        if (e.key === "Escape") {
            clearSelection();
        } else if (e.key === "F2") {
            const sel = $surfaceUI.selectedSurfaces;
            if (sel.length === 1) {
                e.preventDefault();
                $renameRequestId = sel[0];
            }
        } else if ((e.key === "Delete" || e.key === "Backspace") && !isEditing) {

            e.preventDefault();
            deleteSelectedSurfaces();
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
    class={cn(
        "flex flex-col items-stretch justify-start overflow-y-auto max-h-full px-2",
        className
    )}
    use:dndzone={{
        items,
        flipDurationMs: FLIP_DURATION_MS,
        type: SURFACES_DND_TYPE,
        dropTargetClasses: SURFACES_DND_TARGET_CLASSES,
        dropTargetStyle: SURFACES_DND_TARGET_STYLE
    }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    on:click={handleBackgroundClick}
    on:keydown={handleKeyDown}
    role="tree"
    tabindex="-1"
>
    {#each items as item (item.id)}
    <div class="w-full flex flex-col items-stretch" animate:flip={{ duration: FLIP_DURATION_MS }}>
        <SurfaceTreeDisplayItem {item} />
    </div>
    {/each}
</div>