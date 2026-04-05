<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';

    import GroupIcon from "../../../icons/GroupIcon.svelte";
    import QuadIcon from "../../../icons/QuadIcon.svelte";
    import { cn } from "../../../lib/core/utils";
    import { eventStore } from "../../../lib/events/event-store";
    import { surfaceUI } from "../../../lib/stores/user-interface";
    import NameDisplay from "../../Shared/NameDisplay.svelte";
    import VisibleCheckbox from "../../Shared/VisibleCheckbox.svelte";

    import {
        activeDragCompanions,
        applyFinalize,
        clearMultiDrag,
        renameRequestId,
        startMultiDragIfNeeded,
        toggleGroupCollapsed,
        type SurfaceDisplayTreeItem,
    } from "./surface-tree";
    import { FLIP_DURATION_MS, SURFACES_DND_TARGET_CLASSES, SURFACES_DND_TARGET_STYLE, SURFACES_DND_TYPE } from '../../../lib/ui/animations';
    import ChevronIcon from '../../../icons/ChevronIcon.svelte';
    import { surfaceStore } from '../../../lib/stores/surfaces';
    import { selectSurface } from '../../../lib/logic/surfaces/surface-selection';
    import { inputContext } from '../../../lib/ui/actions/inputContext';
    import { InputContexts } from '../../../lib/ui/inputs/input-contexts';

    export let item: SurfaceDisplayTreeItem;
    export let indent: number = 0;
    export let treeDisabled: boolean = false;

    $: id = item.id;
    $: surface = surfaceStore(id);
    $: type = $surface?.type;
    $: selected = $surfaceUI.selectedSurfaces.includes(id);
    $: isDragCompanion = $activeDragCompanions.has(id);
    $: collapsed = type === "Group" && $surfaceUI.collapsedGroups.includes(id);

    $: disabled = treeDisabled || !$surface?.enabled;

    $: iconClasses = cn(
        "size-6",
        "transition-all duration-150",
        !disabled
            ? (selected ? "text-primary-400" : "text-secondary-400")
            : "text-neutral-400",
    );

    let nameDisplay: NameDisplay;

    $: if ($renameRequestId === id && nameDisplay) {
        nameDisplay.startEditing();
        $renameRequestId = null;
    }

    let childItems: SurfaceDisplayTreeItem[] = [];
    let isChildDragging = false;

    $: if (!isChildDragging && type === "Group" && $surface.type === "Group") {
        childItems = $surface.children.map((cid: string) => ({ id: cid }));
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


    function handleClick(e: MouseEvent) {
        if (!surface) return;
        selectSurface(id, { ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, metaKey: e.metaKey });
    }
</script>

<div
    class={cn(
        "flex flex-row justify-between items-center h-6.5 transition-opacity duration-150",
        selected && "bg-primary-400/10",
        isDragCompanion && "opacity-25",
    )}
    use:inputContext={InputContexts.SurfaceTree}
    on:click|stopPropagation={handleClick}
    on:dblclick|stopPropagation={handleClick}
    on:keydown
    role="treeitem"
    aria-selected={selected}
    tabindex="-1"
>
    {#if surface}
    <div class={cn(
        "flex flex-row items-center justify-start",
        (type === "Group" && childItems.length > 0) && "-ml-2"
    )}
    >
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
        {:else if type === "Quad"}
            <QuadIcon className={cn(iconClasses, "p-0.5 stroke-2")} fillColor="none" />
        {/if}
        <NameDisplay
            bind:this={nameDisplay}
            bind:value={$surface.name}
            className={cn(
                disabled ? "text-neutral-400" : (selected ? "text-primary-200" : "text-neutral-200")
            )}
            onCommit={(oldVal, newVal) => eventStore.push({
                category: "Surface", type: "NameChanged",
                forwardData: { surfaceId: id, name: newVal },
                backwardData: { surfaceId: id, name: oldVal },
            })}
        />
    </div>

    <div class="flex flex-row items-center justify-end">
        <VisibleCheckbox
            bind:visible={$surface.enabled}
            className={cn(
                "py-0.5",
                treeDisabled && "opacity-65"
            )}
            onCommit={(oldVal, newVal) => eventStore.push({
                category: "Surface", type: "EnabledChanged",
                forwardData: { surfaceId: id, enabled: newVal },
                backwardData: { surfaceId: id, enabled: oldVal },
            })}
        />
    </div>
    {/if}
</div>

{#if surface && type === "Group"}
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
            type: SURFACES_DND_TYPE,
            dropTargetClasses: SURFACES_DND_TARGET_CLASSES,
            dropTargetStyle: SURFACES_DND_TARGET_STYLE
        }}
        on:consider={handleChildConsider}
        on:finalize={handleChildFinalize}
    >
        {#each childItems as child (child.id)}
        <div class="w-full flex flex-col items-stretch" animate:flip={{ duration: FLIP_DURATION_MS }}>
            <svelte:self item={child} indent={indent + 1} treeDisabled={disabled} />
        </div>
        {/each}
    </div>
</div>
{/if}
