<script lang="ts">
    import ChevronIcon from "../../icons/ChevronIcon.svelte";
    import EditIcon from "../../icons/EditIcon.svelte";
    import { rawColorToCssString, type RawColor } from "../../lib/core/color";
    import { cn } from "../../lib/core/utils";
    import ColorPicker from "./ColorPicker.svelte";
    import type { ColorPickerMode } from "./ColorPicker.svelte";

    export let title: string = "";

    export let value: RawColor = [1, 1, 1, 1];
    export let className: string | undefined = undefined;

    export let open: boolean = false;
    export let mode: ColorPickerMode = "hsv";
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
            <button
                class={cn(
                    "flex items-center justify-center gap-1 rounded-sm",
                    "size-6 shrink-0 p-1 transition-colors cursor-pointer",
                    open ? "text-neutral-200 bg-primary-400" : "text-neutral-200 bg-neutral-600/70"
                )}
                on:click|stopPropagation={() => open = !open}
            >
                <EditIcon className={cn(
                    "size-full transition-all duration-150",
                )} />
            </button>
        </div>
    </div>
    {#if open}
        <ColorPicker bind:value bind:mode />
    {/if}
</div>