<script lang="ts">
    import { cn } from "../../lib/core/utils";

    import VisibleIcon from "../../icons/VisibleIcon.svelte";
    import InvisibleIcon from "../../icons/InvisibleIcon.svelte";

    export let visible: boolean = false;
    export let disabled: boolean = false;
    export let className: string | undefined = undefined;
    export let onCommit: (oldValue: boolean, newValue: boolean) => void = () => {};
</script>

<button
    role="checkbox"
    aria-checked={visible}
    aria-disabled={disabled}
    class={cn(
        "cursor-pointer",
        "transition-all duration-150",
        "inline-flex items-center justify-center",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-500",
        disabled && "opacity-40 pointer-events-none",
        visible ? "text-neutral-100" : "text-neutral-500",
        className
    )}
    on:click|stopPropagation={() => {
        if (!disabled) {
            onCommit(visible, !visible);
            visible = !visible;
        }
    }}
>
    <span class="inline-flex size-4.5 shrink-0 [&_svg]:size-full" aria-hidden="true">
        {#if visible}
            <VisibleIcon />
        {:else}
            <InvisibleIcon />
        {/if}
    </span>
</button>
