<script lang="ts">
    import ChevronIcon from "../../icons/ChevronIcon.svelte";
    import EditIcon from "../../icons/EditIcon.svelte";
    import { rawColorToCssString, type RawColor } from "../../lib/core/color";
    import { cn } from "../../lib/core/utils";
    import ColorPicker from "./ColorPicker.svelte";
    import type { ColorPickerMode } from "./ColorPicker.svelte";
    import Toggle from "./Toggle.svelte";

    export let title: string = "";

    export let value: RawColor = [1, 1, 1, 1];
    export let className: string | undefined = undefined;

    export let open: boolean = false;
    export let mode: ColorPickerMode = "hsv";
    export let onCommit: (oldValue: RawColor, newValue: RawColor) => void = () => {};
</script>

<div class={cn(
    "flex flex-col gap-2",
    className
)}>
    <div class="flex flex-row items-center justify-between gap-0.5">
        <div class="flex flex-row items-center justify-start gap-0.5">

            
            <div class="text-xs uppercase tracking-wide text-neutral-300">{title}</div>
        </div>
        <div class="flex flex-row items-center justify-center gap-1.5">
            <button
                class="h-5 w-8 rounded-xs shrink-0 cursor-pointer" style="background: {rawColorToCssString(value)}"
                on:click|stopPropagation={() => open = !open}
                aria-label="Pick Color"
            ></button>
            <Toggle bind:value={open} label="Open" type="primary">
                <EditIcon className={cn(
                    "size-full transition-all duration-150",
                )} />
            </Toggle>
        </div>
    </div>
    {#if open}
        <ColorPicker bind:value bind:mode {onCommit} />
    {/if}
</div>