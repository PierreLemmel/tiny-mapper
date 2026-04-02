<script lang="ts">
    import LockIcon from "../../icons/LockIcon.svelte";
    import { cn } from "../../lib/core/utils";
    import { SCREEN_X_MIN, SCREEN_X_MAX, SCREEN_Y_MIN, SCREEN_Y_MAX, type Position } from "../../lib/logic/mapping";
    import Scrubber from "./Scrubber.svelte";
    import Toggle from "./Toggle.svelte";

    export let label: string = "Position";
    export let value: Position;
    export let className: string | undefined = undefined;
    export let precision: number = 2;
    export let onCommit: (oldValue: Position, newValue: Position) => void = () => {};

    export let lockScale: boolean = false;
    
    const sensitivity = 0.07;
    const scrubberClasses = "w-20 shrink-0"

    function onXChange( newX: number) {
        const newY = lockScale ? newX * (value[0] !== 0 ? value[1] / value[0] : 1) : value[1];
        value = [newX, newY];
    }

    function onYChange(newY: number) {
        const newX = lockScale ? newY * (value[1] !== 0 ? value[0] / value[1] : 1) : value[0];
        value = [newX, newY];
    }

    function onXCommit(oldX: number, newX: number) {
        const oldValue: Position = [oldX, value[1]];
        onXChange(newX);
        onCommit(oldValue, value);
    }

    function onYCommit(oldY: number, newY: number) {
        const oldValue: Position = [value[0], oldY];
        onYChange(newY);
        onCommit(oldValue, value);
    }
</script>

<div class={cn("flex flex-row items-center justify-between", className)}>
    <span class="text-xs uppercase tracking-wide text-neutral-300">{label}</span>
    <div class={cn(
        "grid gap-1.5 place-items-center",
        "grid-cols-[auto_1fr_1fr]",
    )}>
        <Toggle bind:value={lockScale} label="Lock Scale" type="primary">
            <LockIcon className="size-full" />
        </Toggle>
        <Scrubber
            label="X"
            className={scrubberClasses}
            {precision}
            {sensitivity}
            value={value[0]}
            min={SCREEN_X_MIN}
            max={SCREEN_X_MAX}
            mode="Infinite"
            onChange={newX => onXChange(newX)}
            onCommit={(oldX, newX) => onXCommit(oldX, newX)}
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
            onChange={newY => onYChange(newY)}
            onCommit={(oldY, newY) => onYCommit(oldY, newY)}
        />
    </div>
</div>
