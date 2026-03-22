<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let variant: 'primary' | 'secondary' | 'tertiary' = 'secondary';
    export let disabled: boolean = false;
    export let className: string | undefined = undefined;
    export let onClick: () => void = () => {};

    $: classes = cn(
        "inline-flex items-center justify-center gap-1.5",
        "text-[0.6875rem] font-medium tracking-[0.05em] uppercase",
        "transition-all duration-150 select-none",
        "rounded-md px-3.5 py-1.5",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-500",

        variant === 'primary' && "bg-linear-to-r from-primary-300 to-primary-500 text-neutral-950 font-semibold hover:from-primary-200 hover:to-primary-400 active:from-primary-400 active:to-primary-600",
        variant === 'primary' && disabled && "opacity-40 pointer-events-none",

        variant === 'secondary' && "bg-neutral-800 text-neutral-200 border border-transparent hover:border-secondary-500/40 hover:text-neutral-100 active:bg-neutral-700",
        variant === 'secondary' && disabled && "opacity-40 pointer-events-none",

        variant === 'tertiary' && "bg-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 active:bg-neutral-800",
        variant === 'tertiary' && disabled && "opacity-40 pointer-events-none",

        className
    );
</script>

<button
    class={classes}
    {disabled}
    on:click={onClick}
>
    <slot />
</button>
