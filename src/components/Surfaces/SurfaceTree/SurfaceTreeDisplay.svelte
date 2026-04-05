<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';
    import { onMount } from "svelte";
    import { cn } from "../../../lib/core/utils";
    import {
        applyFinalize,
        clearMultiDrag,
        startMultiDragIfNeeded,
        type SurfaceDisplayTreeItem,
    } from "./surface-tree";
    import SurfaceTreeDisplayItem from "./SurfaceTreeDisplayItem.svelte";
    import { FLIP_DURATION_MS, SURFACES_DND_TARGET_CLASSES, SURFACES_DND_TARGET_STYLE, SURFACES_DND_TYPE } from '../../../lib/ui/animations';
    import { rootSurfaces } from '../../../lib/stores/surfaces';
    import { clearSelection } from '../../../lib/logic/surfaces/surface-selection';
    import { InputContexts } from "../../../lib/ui/inputs/input-contexts";
    import { inputContext } from "../../../lib/ui/actions/inputContext";
    import { registerSurfaceTreeHandlers, unregisterSurfaceTreeHandlers } from '../../../lib/ui/inputs/surfaces/surface-tree-handlers';

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

    onMount(() => {
        registerSurfaceTreeHandlers();

        return () => {
            unregisterSurfaceTreeHandlers();
        };
    });
</script>

<div
    class={cn(
        "panel flex flex-col items-stretch justify-start overflow-y-auto max-h-full px-2",
        className
    )}
    use:dndzone={{
        items,
        flipDurationMs: FLIP_DURATION_MS,
        type: SURFACES_DND_TYPE,
        dropTargetClasses: SURFACES_DND_TARGET_CLASSES,
        dropTargetStyle: SURFACES_DND_TARGET_STYLE
    }}
    use:inputContext={InputContexts.SurfaceTree}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    on:click={handleBackgroundClick}
    on:keydown

    role="tree"
    tabindex="-1"
>
    {#each items as item (item.id)}
    <div class="w-full flex flex-col items-stretch" animate:flip={{ duration: FLIP_DURATION_MS }}>
        <SurfaceTreeDisplayItem {item} />
    </div>
    {/each}
</div>
