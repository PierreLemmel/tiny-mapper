<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let tabs: string[] = [];
    export let activeTab: number = 0;
    export let onTabChange: (index: number) => void = () => {};
    export let className: string | undefined = undefined;

    function selectTab(index: number) {
        activeTab = index;
        onTabChange(index);
    }
</script>

<div class={cn("flex flex-col h-full", className)}>
    <div class="flex shrink-0 bg-neutral-900">
        {#each tabs as tab, i}
            <button
                class={cn(
                    "relative flex-1 h-9 text-[0.6875rem] font-medium tracking-widest uppercase",
                    "transition-colors duration-150",
                    i === activeTab
                        ? "text-neutral-100"
                        : "text-neutral-500 hover:text-neutral-300"
                )}
                on:click={() => selectTab(i)}
            >
                {tab}
                {#if i === activeTab}
                    <span class="absolute bottom-0 left-3 right-3 h-[2px] bg-secondary-500 rounded-full"></span>
                {/if}
            </button>
        {/each}
    </div>

    <div class="flex-1 overflow-auto">
        <slot />
    </div>
</div>
