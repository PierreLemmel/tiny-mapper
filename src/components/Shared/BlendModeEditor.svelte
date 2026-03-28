<script lang="ts">
    import { blendModeValues, type BlendMode } from "../../lib/logic/mapping";
    import { cn } from "../../lib/core/utils";
    import Dropdown from "./Dropdown.svelte";

    export let label: string = "Blend Mode";
    export let value: BlendMode;
    export let className: string | undefined = undefined;
    export let onCommit: (oldValue: BlendMode, newValue: BlendMode) => void = () => {};
</script>

<div class={cn(
    "flex flex-row items-center justify-between",
    className
)}>
    <div class="text-xs uppercase tracking-wide text-neutral-300">{label}</div>
    <Dropdown
        placeholder={"Blend Mode"}
        options={blendModeValues.map(value => ({ value, label: value }))}
        bind:value={value}
        onCommit={(oldVal, newVal) => {
            if (oldVal !== undefined && newVal !== undefined) onCommit(oldVal, newVal);
        }}
    />
</div>