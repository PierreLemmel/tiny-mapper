<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';

    import { cn } from "../../../lib/core/utils";
    import { materialUI } from "../../../lib/stores/user-interface";
    import {
        applyFinalize,
        clearMultiDrag,
        clearSelection,
        deleteSelectedMaterials,
        renameRequestId,
        startMultiDragIfNeeded,
        type MaterialDisplayTreeItem,
    } from "./material-tree";
    import MaterialTreeDisplayItem from "./MaterialTreeDisplayItem.svelte";
    import { FLIP_DURATION_MS, MATERIALS_DND_TARGET_CLASSES, MATERIALS_DND_TARGET_STYLE, MATERIALS_DND_TYPE } from '../../../lib/ui/animations';
    import { rootMaterials } from '../../../lib/stores/materials';

    export let className: string | undefined = undefined;

    let items: MaterialDisplayTreeItem[] = [];
    let isDragging = false;

    $: if (!isDragging) {
        items = $rootMaterials.children.map(id => ({ id }));
    }

    function handleDndConsider(e: CustomEvent<DndEvent<MaterialDisplayTreeItem>>) {
        const { items: newItems, info } = e.detail;

        if (info.trigger === TRIGGERS.DRAG_STARTED) {
            startMultiDragIfNeeded(info.id);
        } else if (info.trigger === TRIGGERS.DRAG_STOPPED) {
            clearMultiDrag();
        }

        items = newItems;
        isDragging = info.trigger !== TRIGGERS.DRAG_STOPPED;
    }

    function handleDndFinalize(e: CustomEvent<DndEvent<MaterialDisplayTreeItem>>) {
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
            const sel = $materialUI.selectedMaterials;
            if (sel.length === 1) {
                e.preventDefault();
                $renameRequestId = sel[0];
            }
        } else if ((e.key === "Delete" || e.key === "Backspace") && !isEditing) {
            e.preventDefault();
            deleteSelectedMaterials();
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
        type: MATERIALS_DND_TYPE,
        dropTargetClasses: MATERIALS_DND_TARGET_CLASSES,
        dropTargetStyle: MATERIALS_DND_TARGET_STYLE
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
        <MaterialTreeDisplayItem {item} />
    </div>
    {/each}
</div>
