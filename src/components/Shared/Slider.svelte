<script lang="ts">
    import { cn, inverseLerp } from "../../lib/core/utils";

    export let label: string = "";
    export let value: number = 0;
    export let color: 'primary' | 'secondary' = 'secondary';
    export let className: string | undefined = undefined;
    export let onCommit: (oldValue: number, newValue: number) => void = () => {};

    export let options: {
        type: 'percentage';
        precision?: number;
    } | {
        type: 'value';
        min: number;
        max: number;
        step?: number;
        unit?: string;
    }

    $: min = options.type === 'percentage' ? 0 : options.min;
    $: max = options.type === 'percentage' ? 1 : options.max;
    $: step = options.type === 'percentage' ? 0.001 : options.step;
    $: unit = options.type === 'percentage' ? '%' : options.unit;

    $: sliderPercentage = inverseLerp(value, min, max) * 100;
    $: displayValue = options.type === 'percentage' ? 100 * value : value;
    $: displayValueStr = options.type === 'percentage' ? displayValue.toFixed(options.precision ?? 1) : (Number.isInteger(displayValue) && Number.isInteger(step)
        ? displayValue.toString()
        : displayValue.toFixed(1));

    let commitStartValue: number | undefined;
</script>

<div class={cn("flex flex-col gap-1.5 py-1", className)}>
    <div class="flex items-center justify-between">
        <span class="text-[0.6875rem] font-medium tracking-widest uppercase text-neutral-350">
            {label}
        </span>
        <span class={cn(
            "text-[0.6875rem] font-medium tabular-nums",
            color === 'secondary' ? 'text-secondary-500' : 'text-primary-400'
        )}>
            {displayValueStr}{unit}
        </span>
    </div>
    <div class="relative h-1 w-full rounded-sm bg-black group">
        <div
            class={cn(
                "absolute inset-y-0 left-0 rounded-sm",
                color === 'secondary' ? 'bg-secondary-500' : 'bg-primary-400'
            )}
            style="width: {sliderPercentage}%"
        ></div>
        <input
            type="range"
            bind:value
            {min}
            {max}
            {step}
            class="slider-input absolute inset-0 w-full h-full cursor-pointer"
            on:pointerdown={() => { commitStartValue = value; }}
            on:change={() => {
                if (commitStartValue !== undefined && commitStartValue !== value) {
                    onCommit(commitStartValue, value);
                }
                commitStartValue = undefined;
            }}
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
