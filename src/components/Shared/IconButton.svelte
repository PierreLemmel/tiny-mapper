<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let variant: 'primary' | 'secondary' | 'tertiary' = 'secondary';
    export let size: 'small' | 'medium' | 'large' = 'medium';
    export let disabled: boolean = false;
    export let className: string | undefined = undefined;
    export let onClick: () => void = () => {};

    $: classes = cn(
        "inline-flex items-center justify-center gap-1.5",
        "cursor-pointer",

        size === 'small' && "size-4 text-[0.6875rem]",
        size === 'medium' && "size-6 text-[0.75rem]",
        size === 'large' && "size-8 text-[1rem]",

        "transition-all duration-150 select-none",
        "rounded-sm p-1",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-500",

        variant === 'primary' && "bg-primary-400 text-neutral-950 font-semibold hover:bg-primary-300 active:bg-primary-400",
        
        variant === 'secondary' && "bg-neutral-800 text-neutral-200 border border-transparent hover:border-secondary-500/40 hover:text-neutral-100 active:bg-neutral-700",
        
        variant === 'tertiary' && "bg-transparent text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/50 active:bg-neutral-800",
        
        disabled && "opacity-40 pointer-events-none",

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
