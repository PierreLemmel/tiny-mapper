<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

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
    import { inputManager } from "../../../lib/ui/inputs/input-manager";
    import { InputContexts } from "../../../lib/ui/inputs/input-contexts";
    import { inputContext } from "../../../lib/ui/actions/inputContext";

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

    let unregisterKeyboard: (() => void) | undefined;

    onMount(() => {
        const unreg: (() => void)[] = [];

        const a = inputManager.registerKeyboardHandler(InputContexts.MaterialTree, "Escape", (e) => {
            clearSelection();
        });
        if (a) unreg.push(a);

        const b = inputManager.registerKeyboardHandler(InputContexts.MaterialTree, "F2", (e) => {
            const sel = get(materialUI).selectedMaterials;
            if (sel.length === 1) {
                e.preventDefault();
                renameRequestId.set(sel[0]);
            }
        });
        if (b) unreg.push(b);

        const c = inputManager.registerKeyboardHandler(InputContexts.MaterialTree, "Delete", (e) => {
            e.preventDefault();
            deleteSelectedMaterials();
        });
        if (c) unreg.push(c);

        const d = inputManager.registerKeyboardHandler(InputContexts.MaterialTree, "Backspace", (e) => {
            e.preventDefault();
            deleteSelectedMaterials();
        });
        if (d) unreg.push(d);

        unregisterKeyboard = () => {
            for (const u of unreg) u();
        };
    });

    onDestroy(() => {
        unregisterKeyboard?.();
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
        type: MATERIALS_DND_TYPE,
        dropTargetClasses: MATERIALS_DND_TARGET_CLASSES,
        dropTargetStyle: MATERIALS_DND_TARGET_STYLE
    }}
    use:inputContext={InputContexts.MaterialTree}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
    on:click={handleBackgroundClick}
    on:keydown

    role="tree"
    tabindex="-1"
>
    {#each items as item (item.id)}
    <div class="w-full flex flex-col items-stretch" animate:flip={{ duration: FLIP_DURATION_MS }}>
        <MaterialTreeDisplayItem {item} />
    </div>
    {/each}
</div>
