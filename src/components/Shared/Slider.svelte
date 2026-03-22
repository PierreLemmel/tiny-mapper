<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let label: string = "";
    export let value: number = 0;
    export let min: number = 0;
    export let max: number = 100;
    export let step: number = 0.1;
    export let unit: string = "";
    export let color: 'primary' | 'secondary' = 'secondary';
    export let className: string | undefined = undefined;

    $: percentage = ((value - min) / (max - min)) * 100;
    $: displayValue = Number.isInteger(value) && Number.isInteger(step)
        ? value.toString()
        : value.toFixed(1);
</script>

<div class={cn("flex flex-col gap-1.5 py-1", className)}>
    <div class="flex items-center justify-between">
        <span class="text-[0.6875rem] font-medium tracking-widest uppercase text-neutral-400">
            {label}
        </span>
        <span class={cn(
            "text-[0.6875rem] font-medium tabular-nums",
            color === 'secondary' ? 'text-secondary-500' : 'text-primary-400'
        )}>
            {displayValue}{unit}
        </span>
    </div>
    <div class="relative h-1 w-full rounded-sm bg-black group">
        <div
            class={cn(
                "absolute inset-y-0 left-0 rounded-sm",
                color === 'secondary' ? 'bg-secondary-500' : 'bg-primary-400'
            )}
            style="width: {percentage}%"
        ></div>
        <input
            type="range"
            bind:value
            {min}
            {max}
            {step}
            class="slider-input absolute inset-0 w-full h-full cursor-pointer"
        />
    </div>
</div>

<style>
    .slider-input {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        margin: 0;
        padding: 0;
    }

    .slider-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: var(--color-neutral-100);
        opacity: 0;
        transition: opacity 150ms;
        cursor: pointer;
    }

    .slider-input:hover::-webkit-slider-thumb,
    .slider-input:active::-webkit-slider-thumb {
        opacity: 1;
    }

    .slider-input::-moz-range-thumb {
        width: 10px;
        height: 10px;
        border-radius: 2px;
        background: var(--color-neutral-100);
        border: none;
        opacity: 0;
        transition: opacity 150ms;
        cursor: pointer;
    }

    .slider-input:hover::-moz-range-thumb,
    .slider-input:active::-moz-range-thumb {
        opacity: 1;
    }

    .slider-input::-webkit-slider-runnable-track {
        background: transparent;
    }

    .slider-input::-moz-range-track {
        background: transparent;
    }
</style>
