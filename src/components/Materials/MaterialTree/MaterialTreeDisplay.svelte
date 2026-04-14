<script lang="ts">
    import { dndzone, TRIGGERS, type DndEvent } from "svelte-dnd-action";
    import { flip } from "svelte/animate";
    import { onDestroy, onMount } from "svelte";
    import { get } from "svelte/store";

    import GroupIcon from "../../../icons/GroupIcon.svelte";
    import SolidColorIcon from "../../../icons/SolidColorIcon.svelte";
    import TextureIcon from "../../../icons/TextureIcon.svelte";
    import { cn } from "../../../lib/core/utils";
    import { eventStore } from "../../../lib/events/event-store";
    import {
        createGroupMaterial,
        createMaterialMaterialFromTemplate,
        createSolidColorMaterial,
        getMaterialInsertionPoint,
    } from "../../../lib/logic/materials/materials";
    import { materialUI } from "../../../lib/stores/user-interface";
    import { materials, rootMaterials } from "../../../lib/stores/materials";
    import { inputManager } from "../../../lib/ui/inputs/input-manager";
    import { InputContexts } from "../../../lib/ui/inputs/input-contexts";
    import { inputContext } from "../../../lib/ui/actions/inputContext";
    import IconButton from "../../Shared/IconButton.svelte";
    import MaterialTemplatePickerModal from "../../Shared/MaterialTemplatePickerModal.svelte";
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
    import {
        FLIP_DURATION_MS,
        MATERIALS_DND_TARGET_CLASSES,
        MATERIALS_DND_TARGET_STYLE,
        MATERIALS_DND_TYPE,
    } from "../../../lib/ui/animations";
    import type { GroupMaterial } from "../../../lib/logic/materials/materials";

    export let className: string | undefined = undefined;

    let items: MaterialDisplayTreeItem[] = [];
    let isDragging = false;
    let templatePickerOpen = false;

    $: allTags = (() => {
        const tags = new Set<string>();
        for (const m of Object.values($materials)) {
            if (m.tags) {
                for (const tag of m.tags) {
                    tags.add(tag);
                }
            }
        }
        return Array.from(tags).sort();
    })();

    $: activeTag = $materialUI.tagFilter;
    $: searchQuery = $materialUI.searchQuery;

    function setTagFilter(tag: string | null) {
        materialUI.update(ui => ({ ...ui, tagFilter: tag }));
    }

    function setSearchQuery(query: string) {
        materialUI.update(ui => ({ ...ui, searchQuery: query }));
    }

    function handleCreateSolidColorMaterial() {
        const { parentId, positionInChildren } = getMaterialInsertionPoint(get(materialUI).selectedMaterials);
        const material = createSolidColorMaterial({ parentId }, positionInChildren);
        eventStore.push({
            category: "Material",
            type: "Created",
            forwardData: { material: structuredClone(material) },
            backwardData: { materialId: material.id },
        });
    }

    function handleCreateGroupMaterial() {
        const { parentId, positionInChildren } = getMaterialInsertionPoint(get(materialUI).selectedMaterials);
        const material = createGroupMaterial({ parentId }, positionInChildren);
        eventStore.push({
            category: "Material",
            type: "Created",
            forwardData: { material: structuredClone(material) },
            backwardData: { materialId: material.id },
        });
    }

    function handlePickTemplate(templateId: string) {
        const { parentId, positionInChildren } = getMaterialInsertionPoint(get(materialUI).selectedMaterials);
        const material = createMaterialMaterialFromTemplate(templateId, { parentId }, positionInChildren);
        eventStore.push({
            category: "Material",
            type: "Created",
            forwardData: { material: structuredClone(material) },
            backwardData: { materialId: material.id },
        });
    }

    function materialMatchesFilter(id: string, tagFilter: string | null, searchQ: string): boolean {
        const m = $materials[id];
        if (!m) return true;
        if (m.hidden) return false;

        if (tagFilter !== null) {
            if (!m.tags || !m.tags.includes(tagFilter)) {
                if (m.type === "Group") {
                    const groupMat = m as GroupMaterial;
                    return groupMat.children.some(cid => materialMatchesFilter(cid, tagFilter, searchQ));
                }
                return false;
            }
        }

        if (searchQ.length > 0) {
            const query = searchQ.toLowerCase();
            const nameMatch = m.name.toLowerCase().includes(query);
            const tagMatch = m.tags?.some(t => t.toLowerCase().includes(query)) ?? false;
            if (!nameMatch && !tagMatch) {
                if (m.type === "Group") {
                    const groupMat = m as GroupMaterial;
                    return groupMat.children.some(cid => materialMatchesFilter(cid, null, searchQ));
                }
                return false;
            }
        }

        return true;
    }

    $: if (!isDragging) {
        const tagFilter = $materialUI.tagFilter;
        const searchQ = $materialUI.searchQuery;
        items = $rootMaterials.children
            .filter(id => materialMatchesFilter(id, tagFilter, searchQ))
            .map(id => ({ id }));
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
        "flex flex-col flex-1 min-h-0 items-stretch gap-2 pt-1.5",
        className,
    )}
>
    <div class="flex flex-col gap-2 items-stretch shrink-0 my-3 px-1">
        <div class="flex flex-row flex-wrap gap-2 items-center justify-center">
            <IconButton variant="primary" onClick={handleCreateSolidColorMaterial} size="large">
                <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                    <SolidColorIcon />
                </span>
            </IconButton>
            <IconButton variant="primary" onClick={() => templatePickerOpen = true} size="large">
                <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                    <TextureIcon />
                </span>
            </IconButton>
            <IconButton variant="primary" onClick={handleCreateGroupMaterial} size="large">
                <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                    <GroupIcon className="stroke-[1px]" />
                </span>
            </IconButton>
        </div>
    </div>

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
                placeholder="Search library..."
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
            type: MATERIALS_DND_TYPE,
            dropTargetClasses: MATERIALS_DND_TARGET_CLASSES,
            dropTargetStyle: MATERIALS_DND_TARGET_STYLE,
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
</div>

<MaterialTemplatePickerModal bind:open={templatePickerOpen} onPick={handlePickTemplate} />
