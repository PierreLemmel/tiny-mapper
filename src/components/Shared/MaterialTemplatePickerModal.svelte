<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import {
        DEFAULT_MATERIAL_TEMPLATE_ID,
        type MaterialTemplate,
    } from "../../lib/logic/material-templates/material-templates";
    import { materialTemplates } from "../../lib/stores/material-templates";

    export let open: boolean = false;
    export let onPick: (templateId: string) => void = () => {};

    let searchQuery = "";

    $: visibleTemplates = Object.values($materialTemplates)
        .filter(t => !t.hidden || t.id === DEFAULT_MATERIAL_TEMPLATE_ID)
        .filter(t =>
            !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    function pick(t: MaterialTemplate) {
        onPick(t.id);
        open = false;
        searchQuery = "";
    }

    function close() {
        open = false;
        searchQuery = "";
    }

    function backdropMousedown(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }

    function templateInitials(name: string): string {
        return name.split(/[_\-\s]+/).map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
    }
</script>

<svelte:window on:keydown={(e) => open && e.key === "Escape" && close()} />

{#if open}
<div
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/55 p-4"
    on:mousedown={backdropMousedown}
    role="presentation"
>
    <div
        class={cn(
            "w-full max-w-md max-h-[85vh] min-h-0 flex flex-col gap-3 rounded-xl",
            "bg-neutral-900 border border-neutral-700 shadow-xl p-4",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-picker-title"
        tabindex="-1"
        on:mousedown|stopPropagation
    >
        <div class="flex flex-row items-center justify-between gap-2 shrink-0">
            <div id="template-picker-title" class="text-xs uppercase tracking-wide text-neutral-300">
                Select template
            </div>
            <button
                type="button"
                class="text-[0.625rem] font-medium uppercase tracking-wider text-neutral-500 hover:text-neutral-200 transition-colors"
                on:click={close}
            >
                Close
            </button>
        </div>

        <div class="relative shrink-0">
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

        <div class="grid grid-cols-3 gap-2 content-start overflow-y-auto min-h-0 flex-1">
            {#each visibleTemplates as template (template.id)}
                <button
                    type="button"
                    class={cn(
                        "flex flex-col items-stretch gap-1.5 rounded-lg p-1.5 transition-all duration-150 cursor-pointer",
                        "hover:bg-neutral-800/60 ring-1 ring-transparent hover:ring-neutral-600",
                    )}
                    on:click={() => pick(template)}
                >
                    <div
                        class="aspect-square rounded-md flex items-center justify-center overflow-hidden bg-linear-to-br from-neutral-700 to-neutral-800"
                    >
                        <span class="text-[0.65rem] font-semibold text-neutral-400 select-none">
                            {templateInitials(template.name)}
                        </span>
                    </div>
                    <div class="text-[0.6rem] text-center truncate px-0.5 text-neutral-400">
                        {template.name}
                    </div>
                </button>
            {/each}
        </div>

        {#if visibleTemplates.length === 0}
            <div class="text-center text-xs text-neutral-500 py-4">
                No templates found
            </div>
        {/if}
    </div>
</div>
{/if}
