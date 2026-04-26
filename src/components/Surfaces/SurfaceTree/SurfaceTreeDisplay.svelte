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
    import { rootSurfaces, surfaces } from '../../../lib/stores/surfaces';
    import { clearSelection } from '../../../lib/logic/surfaces/surface-selection';
    import { InputContexts } from "../../../lib/ui/inputs/input-contexts";
    import { inputContext } from "../../../lib/ui/actions/inputContext";
    import { registerSurfaceTreeHandlers, unregisterSurfaceTreeHandlers } from '../../../lib/ui/inputs/surfaces/surface-tree-handlers';
    import { surfaceUI } from '../../../lib/stores/user-interface';
    import type { GroupSurface } from '../../../lib/logic/surfaces/surfaces';

    export let className: string | undefined = undefined;

    let items: SurfaceDisplayTreeItem[] = [];
    let isDragging = false;

    $: allTags = (() => {
        const tags = new Set<string>();
        for (const s of Object.values($surfaces)) {
            if (s.tags) {
                for (const tag of s.tags) {
                    tags.add(tag);
                }
            }
        }
        return Array.from(tags).sort();
    })();

    $: activeTag = $surfaceUI.tagFilter;
    $: searchQuery = $surfaceUI.searchQuery;

    function setTagFilter(tag: string | null) {
        surfaceUI.update(ui => ({ ...ui, tagFilter: tag }));
    }

    function setSearchQuery(query: string) {
        surfaceUI.update(ui => ({ ...ui, searchQuery: query }));
    }

    function surfaceMatchesFilter(id: string, tagFilter: string | null, searchQ: string): boolean {
        const s = $surfaces[id];
        if (!s) return true;

        if (tagFilter !== null) {
            if (!s.tags || !s.tags.includes(tagFilter)) {
                if (s.type === "Group") {
                    const groupSurf = s as GroupSurface;
                    return groupSurf.children.some(cid => surfaceMatchesFilter(cid, tagFilter, searchQ));
                }
                return false;
            }
        }

        if (searchQ.length > 0) {
            const query = searchQ.toLowerCase();
            const nameMatch = s.name.toLowerCase().includes(query);
            const tagMatch = s.tags?.some(t => t.toLowerCase().includes(query)) ?? false;
            if (!nameMatch && !tagMatch) {
                if (s.type === "Group") {
                    const groupSurf = s as GroupSurface;
                    return groupSurf.children.some(cid => surfaceMatchesFilter(cid, null, searchQ));
                }
                return false;
            }
        }

        return true;
    }

    $: if (!isDragging) {
        const tagFilter = $surfaceUI.tagFilter;
        const searchQ = $surfaceUI.searchQuery;
        items = $rootSurfaces.children
            .filter(id => surfaceMatchesFilter(id, tagFilter, searchQ))
            .map(id => ({ id }));
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

<div class={cn(
    "flex flex-col items-stretch min-h-0 flex-1 gap-2",
    className
)}>
    <div class="flex flex-col gap-2 px-2 shrink-0">
        <div class="relative">
            <svg
                class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                type="text"
                placeholder="Search surfaces..."
                value={searchQuery}
                on:input={(e) => setSearchQuery(e.currentTarget.value)}
                class={cn(
                    "w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50",
                    "pl-8 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500",
                    "outline-none transition-colors duration-150",
                    "focus:border-neutral-600 focus:bg-neutral-800",
                )}
            />
        </div>

        {#if allTags.length > 0}
            <div class="flex flex-row flex-wrap gap-1">
                <button
                    class={cn(
                        "px-3 py-1 text-[0.625rem] font-medium uppercase tracking-wider rounded-md transition-colors duration-150",
                        activeTag === null
                            ? "bg-neutral-700 text-neutral-100"
                            : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800",
                    )}
                    on:click={() => setTagFilter(null)}
                >
                    All
                </button>
                {#each allTags as tag}
                    <button
                        class={cn(
                            "px-3 py-1 text-[0.625rem] font-medium uppercase tracking-wider rounded-md transition-colors duration-150",
                            activeTag === tag
                                ? "bg-neutral-700 text-neutral-100"
                                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800",
                        )}
                        on:click={() => setTagFilter(tag)}
                    >
                        {tag}
                    </button>
                {/each}
            </div>
        {/if}
    </div>

    <div
        class={cn(
            "panel flex flex-col items-stretch justify-start overflow-y-auto min-h-0 flex-1 px-2",
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
</div>
