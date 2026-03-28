<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import RotationKnob from "./RotationKnob.svelte";
    import Scrubber from "./Scrubber.svelte";

    export let label: string = "Rotation";
    export let value: number;
    export let className: string | undefined = undefined;
    export let onCommit: (oldValue: number, newValue: number) => void = () => {};
</script>

<div class={cn("flex flex-row items-center justify-between", className)}>
    <span class="text-xs uppercase tracking-wide text-neutral-300">{label}</span>
    
    <div class="flex flex-row items-center justify-end gap-1.5">
        <Scrubber
            label="Angle"
            className="w-20 shrink-0"
            precision={2}
            sensitivity={1}
            bind:value
            min={0}
            max={360}
            minMaxMode="Circular"
            unit="°"
            mode="Infinite"
            {onCommit}
        />
        <RotationKnob bind:value className="size-9 shrink-0" {onCommit} />
    </div>
</div>
