<script lang="ts">
    import ChevronIcon from "../../icons/ChevronIcon.svelte";
    import { cn } from "../../lib/core/utils";
    import IconButton from "./IconButton.svelte";

    export let open: boolean = false;

    export let title: string = "";
    export let className: string | undefined = undefined;
</script>

<div class={cn("flex flex-col items-stretch", className)}>
    <button
        class={cn(
            "flex items-center justify-start gap-0.5",
            "h-4 shrink-0 transition-colors cursor-pointer",
            "-ml-1",
        )}
        on:click|stopPropagation={() => open = !open}
    >
        <ChevronIcon className={cn(
            "text-neutral-400 hover:text-neutral-200",
            "size-3.5 transition-transform duration-150",
            !open && "-rotate-90"
        )} />
        <div class="text-xs uppercase tracking-wide text-neutral-300 hover:text-neutral-200">{title}</div>
    </button>
    {#if open}
        <div class="flex-1 pl-3.5 py-2">
            <slot />
        </div>
    {/if}
</div>