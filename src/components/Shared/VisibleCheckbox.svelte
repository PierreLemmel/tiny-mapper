<script lang="ts">
    import { cn } from "../../lib/core/utils";

    import VisibleIcon from "../../icons/VisibleIcon.svelte";
    import InvisibleIcon from "../../icons/InvisibleIcon.svelte";

    export let visible: boolean = false;
    export let disabled: boolean = false;
    export let className: string | undefined = undefined;
</script>

<button
    role="checkbox"
    aria-checked={visible}
    aria-disabled={disabled}
    class={cn(
        "transition-all duration-150",
        "inline-flex items-center justify-center",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500",
        disabled && "opacity-40 pointer-events-none",
        visible ? "text-neutral-100" : "text-neutral-500",
        className
    )}
    on:click={() => { if (!disabled) visible = !visible; }}
>
    {#if visible}
        <span class="inline-flex size-5 shrink-0 [&_svg]:size-full" aria-hidden="true">
            <VisibleIcon />
        </span>
    {:else}
        <span class="inline-flex size-5 shrink-0 [&_svg]:size-full" aria-hidden="true">
            <InvisibleIcon />
        </span>
    {/if}
</button>
