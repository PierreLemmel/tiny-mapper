<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import CheckmarkIcon from "../../icons/CheckmarkIcon.svelte";

    export let checked: boolean = false;
    export let disabled: boolean = false;
    export let className: string | undefined = undefined;
</script>

<button
    role="checkbox"
    aria-checked={checked}
    aria-disabled={disabled}
    class={cn(
        "size-3.5 rounded-[3px] shrink-0",
        "border transition-all duration-150",
        "inline-flex items-center justify-center",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-500",
        checked
            ? "bg-primary-500 border-primary-500 text-neutral-50"
            : "bg-transparent border-neutral-600 hover:border-neutral-400",
        disabled && "opacity-40 pointer-events-none",
        className
    )}
    on:click={() => { if (!disabled) checked = !checked; }}
>
    {#if checked}
        <span class="inline-flex size-2.5 [&_svg]:size-full" aria-hidden="true">
            <CheckmarkIcon />
        </span>
    {/if}
</button>
