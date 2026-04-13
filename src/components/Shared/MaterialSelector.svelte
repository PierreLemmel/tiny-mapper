<script lang="ts">
    import EditIcon from "../../icons/EditIcon.svelte";
    import { cn } from "../../lib/core/utils";
    import { materials, getAllTags } from "../../lib/stores/materials";
    import type { Material } from "../../lib/logic/materials/materials";
    import Toggle from "./Toggle.svelte";

    export let title: string = "Material";
    export let open: boolean = false;
    export let value: string | undefined = undefined;
    export let className: string | undefined = undefined;
    export let onCommit: (oldValue: string | undefined, newValue: string) => void = () => {};

    let searchQuery = "";
    let activeTagIndex = 0;

    $: allTags = getAllTags();
    $: tabs = ["All", ...allTags];
    $: activeTag = activeTagIndex === 0 ? null : allTags[activeTagIndex - 1];

    $: allMaterials = Object.values($materials)
        .filter((m): m is Extract<typeof m, { type: "Material" | "SolidColor" }> =>
            (m.type === "Material" || m.type === "SolidColor") && !m.hidden
        );

    $: filteredMaterials = allMaterials.filter(m => {
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!m.name.toLowerCase().includes(q)) return false;
        }
        if (activeTag) {
            if (!m.tags || !m.tags.includes(activeTag)) return false;
        }
        return true;
    });

    $: selectedMaterial = value
        ? allMaterials.find(m => m.id === value)
        : undefined;

    function select(material: Material) {
        const oldValue = value;
        value = material.id;
        onCommit(oldValue, material.id);
    }

    function materialInitials(name: string): string {
        return name.split(/[_\-\s]+/).map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
    }
</script>

<div class={cn("flex flex-col gap-2", className)}>
    <div class="flex flex-row items-center justify-between gap-0.5">
        <div class="flex flex-row items-center justify-start gap-0.5">
            <div class="text-xs uppercase tracking-wide text-neutral-300">{title}</div>
        </div>
        <div class="flex flex-row items-center justify-center gap-1.5">
            {#if selectedMaterial}
                <div class="text-xs text-neutral-200">{selectedMaterial.name}</div>
            {/if}
            <button
                type="button"
                class={cn(
                    "h-5 w-8 rounded-xs shrink-0 cursor-pointer overflow-hidden flex items-center justify-center",
                    !selectedMaterial && "bg-neutral-700",
                    selectedMaterial?.type === "Material" && "bg-linear-to-br from-neutral-700 to-neutral-800"
                )}
                style={selectedMaterial?.type === "SolidColor"
                    ? `background: rgba(${Math.round(selectedMaterial.color[0] * 255)},${Math.round(selectedMaterial.color[1] * 255)},${Math.round(selectedMaterial.color[2] * 255)},${selectedMaterial.color[3]})`
                    : undefined}
                on:click|stopPropagation={() => open = !open}
                aria-label="Open material library"
            >
                {#if selectedMaterial && selectedMaterial.type !== "SolidColor"}
                    <span class="text-[0.5rem] font-semibold text-neutral-400 select-none">
                        {materialInitials(selectedMaterial.name)}
                    </span>
                {/if}
            </button>
            <Toggle bind:value={open} label="Open" type="primary">
                <EditIcon className={cn(
                    "size-full transition-all duration-150",
                )} />
            </Toggle>
        </div>
    </div>

    {#if open}
    <div class="flex flex-col gap-3">
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
            bind:value={searchQuery}
            class={cn(
                "w-full rounded-lg bg-neutral-800/80 border border-neutral-700/50",
                "pl-8 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500",
                "outline-none transition-colors duration-150",
                "focus:border-neutral-600 focus:bg-neutral-800",
            )}
        />
    </div>

    {#if tabs.length > 1}
        <div class="flex items-center gap-1 flex-wrap">
            {#each tabs as tab, i}
                <button
                    class={cn(
                        "px-3 py-1 text-[0.625rem] font-medium uppercase tracking-wider rounded-md transition-colors duration-150",
                        i === activeTagIndex
                            ? "bg-neutral-700 text-neutral-100"
                            : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800"
                    )}
                    on:click={() => activeTagIndex = i}
                >
                    {tab}
                </button>
            {/each}
        </div>
    {/if}

    <div class="grid grid-cols-3 gap-2">
        {#each filteredMaterials as material (material.id)}
            <button
                class={cn(
                    "flex flex-col items-stretch gap-1.5 rounded-lg p-1.5 transition-all duration-150 cursor-pointer",
                    "hover:bg-neutral-800/60",
                    material.id === value
                        ? "ring-2 ring-primary-400 bg-neutral-800/40"
                        : "ring-1 ring-transparent"
                )}
                on:click={() => select(material)}
            >
                <div class={cn(
                    "aspect-square rounded-md flex items-center justify-center overflow-hidden",
                    material.type === "SolidColor"
                        ? ""
                        : "bg-linear-to-br from-neutral-700 to-neutral-800"
                )}
                    style={material.type === "SolidColor"
                        ? `background: rgba(${Math.round(material.color[0]*255)},${Math.round(material.color[1]*255)},${Math.round(material.color[2]*255)},${material.color[3]})`
                        : ""}
                >
                    <span class="text-[0.65rem] font-semibold text-neutral-400 select-none">
                        {materialInitials(material.name)}
                    </span>
                </div>
                <div class={cn(
                    "text-[0.6rem] text-center truncate px-0.5",
                    material.id === value ? "text-primary-300" : "text-neutral-400"
                )}>
                    {material.name}
                </div>
            </button>
        {/each}
    </div>

    {#if filteredMaterials.length === 0}
        <div class="text-center text-xs text-neutral-500 py-4">
            No materials found
        </div>
    {/if}
    </div>
    {/if}
</div>
