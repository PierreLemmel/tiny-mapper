<script lang="ts">
    import ChevronIcon from "../../icons/ChevronIcon.svelte";
    import { cn } from "../../lib/core/utils";

    export let category: string;
    export let errors: string[];

    let collapsed = false;
</script>

<div class={cn(
    "flex flex-col gap-2 py-0.5 px-0.5",
    "text-sm font-medium",
    "text-neutral-400",
)}>
    <button type="button" on:click={() => collapsed = !collapsed} tabindex="-1"
    class={cn(
        "flex flex-row items-center justify-start gap-1",
        "cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-500",
    )}
    >
        <ChevronIcon className={cn(
            "size-3 transition-transform duration-150",
            collapsed && "-rotate-90"
        )} />
        <div class="text-neutral-500 uppercase tracking-wide">{category}</div>
    </button>
    {#if !collapsed}
        <div class="flex flex-col gap-1 text-red-500 pl-4">
            {#each errors as error}
                <div>{error}</div>
            {/each}
        </div>
    {/if}
</div>