<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let tabs: string[] = [];
    export let activeTab: number = 0;
    export let className: string | undefined = undefined;

    function selectTab(index: number) {
        activeTab = index;
    }
</script>

<nav class={cn(
    "h-11 bg-neutral-900 flex items-center px-4 pt-4 pb-3 shrink-0 select-none",
    className
)}>
    <div class="font-display font-bold text-neutral-100 tracking-[0.15em] text-sm mr-8 uppercase">
        Tiny Mapper
    </div>

    <div class="flex items-center gap-1">
        {#each tabs as tab, i}
            <button
                class={cn(
                    "relative px-4 h-11 text-[0.75rem] font-medium tracking-widest uppercase transition-colors duration-150",
                    i === activeTab
                        ? "text-secondary-500"
                        : "text-neutral-500 hover:text-neutral-300"
                )}
                on:click={() => selectTab(i)}
            >
                {tab}
                {#if i === activeTab}
                    <span class="absolute bottom-0 left-2 right-2 h-[2px] bg-secondary-500 rounded-full"></span>
                {/if}
            </button>
        {/each}
    </div>

    <div class="flex-1"></div>

    <div class="flex items-center gap-1.5">
        <slot name="actions" />
    </div>
</nav>
