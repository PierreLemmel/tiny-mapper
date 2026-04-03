<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let tabs: string[] = [];
    export let activeTab: number = 0;
    export let className: string | undefined = undefined;

    function selectTab(index: number) {
        activeTab = index;
    }
</script>

<div class={cn("flex items-center gap-1 bg-neutral-900 rounded-lg p-1", className)}>
    {#each tabs as tab, i}
        <button
            class={cn(
                "flex-1 h-7 px-3 text-[0.6875rem] font-medium tracking-widest uppercase rounded-md transition-colors duration-150",
                i === activeTab
                    ? "bg-neutral-700 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-300"
            )}
            on:click={() => selectTab(i)}
        >
            {tab}
        </button>
    {/each}
</div>
