<script lang="ts">
    import IconButton from "../Shared/IconButton.svelte";
    import GroupIcon from "../../icons/GroupIcon.svelte";
    import {
        createGroupMaterial,
        createMaterialMaterialFromTemplate,
        createSolidColorMaterial,
        getMaterialInsertionPoint,
    } from "../../lib/logic/materials/materials";
    import { DEFAULT_MATERIAL_TEMPLATE_ID } from "../../lib/logic/material-templates/material-templates";
    import { cn } from "../../lib/core/utils";
    import MaterialTreeDisplay from "./MaterialTree/MaterialTreeDisplay.svelte";
    import { eventStore } from "../../lib/events/event-store";
    import { materialUI } from "../../lib/stores/user-interface";
    import { materialTemplates } from "../../lib/stores/material-templates";
    import { get } from "svelte/store";
    import SolidColorIcon from "../../icons/SolidColorIcon.svelte";
    import Dropdown, { type DropdownOption } from "../Shared/Dropdown.svelte";
    import { materials } from "../../lib/stores/materials";
    import TextureIcon from "../../icons/TextureIcon.svelte";

    export let className: string | undefined = undefined;

    let selectedTemplateId: string = DEFAULT_MATERIAL_TEMPLATE_ID;

    $: templateOptions = Object.values($materialTemplates).map(t => ({
        value: t.id,
        label: t.name,
    })) as DropdownOption<string>[];

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

    function handleCreateMaterialFromTemplate() {
        const { parentId, positionInChildren } = getMaterialInsertionPoint(get(materialUI).selectedMaterials);
        const material = createMaterialMaterialFromTemplate(selectedTemplateId, { parentId }, positionInChildren);
        eventStore.push({
            category: "Material",
            type: "Created",
            forwardData: { material: structuredClone(material) },
            backwardData: { materialId: material.id },
        });
    }
</script>

<div class={cn(
    "panel w-full h-full",
    "flex flex-col items-stretch justify-center",
    "gap-2 pt-1.5",
    className
)}>
    <div class="flex flex-col gap-2 items-stretch my-3 px-1">
        <div class="flex flex-row flex-wrap gap-2 items-center justify-center">
            <IconButton variant="primary" onClick={handleCreateSolidColorMaterial} size="large">
                <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                    <SolidColorIcon />
                </span>
            </IconButton>
            <IconButton variant="primary" onClick={handleCreateMaterialFromTemplate} size="large">
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
        <!-- <div class="flex flex-row flex-wrap gap-2 items-center justify-center">
            <Dropdown
                className="min-w-0 flex-1 max-w-[200px]"
                options={templateOptions}
                bind:value={selectedTemplateId}
            />
            <IconButton variant="primary" onClick={handleCreateMaterialFromTemplate} size="large">
                <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                    <TextureIcon />
                </span>
            </IconButton>
        </div> -->
    </div>

    <div class="flex flex-col gap-2 px-2">
        <div class="relative">
            <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
                type="text"
                placeholder="Search library..."
                value={searchQuery}
                on:input={(e) => setSearchQuery(e.currentTarget.value)}
                class={cn(
                    "w-full pl-8 pr-3 py-1.5 rounded-md",
                    "bg-neutral-800 border border-transparent",
                    "text-xs text-neutral-200 placeholder:text-neutral-500",
                    "focus:outline-none focus:border-secondary-500/40",
                    "transition-colors duration-150"
                )}
            />
        </div>

        {#if allTags.length > 0}
        <div class="flex flex-row flex-wrap gap-1.5">
            <button
                class={cn(
                    "px-2.5 py-1 rounded-md text-[0.625rem] font-medium uppercase tracking-wider",
                    "transition-all duration-150 cursor-pointer",
                    activeTag === null
                        ? "bg-primary-400/20 text-primary-300 border border-primary-400/40"
                        : "bg-neutral-800 text-neutral-400 border border-transparent hover:text-neutral-200 hover:border-neutral-600"
                )}
                on:click={() => setTagFilter(null)}
            >All</button>
            {#each allTags as tag}
            <button
                class={cn(
                    "px-2.5 py-1 rounded-md text-[0.625rem] font-medium uppercase tracking-wider",
                    "transition-all duration-150 cursor-pointer",
                    activeTag === tag
                        ? "bg-primary-400/20 text-primary-300 border border-primary-400/40"
                        : "bg-neutral-800 text-neutral-400 border border-transparent hover:text-neutral-200 hover:border-neutral-600"
                )}
                on:click={() => setTagFilter(tag)}
            >{tag}</button>
            {/each}
        </div>
        {/if}
    </div>

    <MaterialTreeDisplay className="flex-1" />
</div>
