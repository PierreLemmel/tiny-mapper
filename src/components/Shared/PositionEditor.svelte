<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import { SCREEN_X_MIN, SCREEN_X_MAX, SCREEN_Y_MIN, SCREEN_Y_MAX, type Position } from "../../lib/logic/mapping";
    import Scrubber from "./Scrubber.svelte";

    export let label: string = "Position";
    export let value: Position;
    export let className: string | undefined = undefined;
    export let precision: number = 2;
    export let onCommit: (oldValue: Position, newValue: Position) => void = () => {};

    export let sensitivity: number = 2;

    const scrubberClasses = "w-20 shrink-0"
</script>

<div class={cn("flex flex-row items-center justify-between", className)}>
    <span class="text-xs uppercase tracking-wide text-neutral-300">{label}</span>
    <div class="grid grid-cols-2 gap-1.5">
        <Scrubber
            label="X"
            className={scrubberClasses}
            {precision}
            {sensitivity}
            value={value[0]}
            min={SCREEN_X_MIN}
            max={SCREEN_X_MAX}
            mode="Infinite"
            onChange={v => { value = [v, value[1]]; }}
            onCommit={(oldX) => { onCommit([oldX, value[1]], value); }}
        />
        <Scrubber
            label="Y"
            className={scrubberClasses}
            {precision}
            {sensitivity}
            value={value[1]}
            min={SCREEN_Y_MIN}
            max={SCREEN_Y_MAX}
            mode="Infinite"
            onChange={v => { value = [value[0], v]; }}
            onCommit={(oldY) => { onCommit([value[0], oldY], value); }}
        />
    </div>
</div>
