<script lang="ts">
    import FlipIcon from "../../icons/FlipIcon.svelte";
    import { cn } from "../../lib/core/utils";
    import type { SurfaceFlip } from "../../lib/logic/mapping";

    export let label: string = "Flip";

    export let value: SurfaceFlip;
    export let className: string | undefined = undefined;

    const flipOptions: { flip: SurfaceFlip, label: string, transform: string }[] = [
        { flip: [false, false], label: "None", transform: "none" },
        { flip: [true, false], label: "Horizontal", transform: "scaleX(-1)" },
        { flip: [true, true], label: "Both", transform: "scale(-1, -1)" },    
        { flip: [false, true], label: "Vertical", transform: "scaleY(-1)" },
    ];

    $: flipIndex = flipOptions.findIndex(option => option.flip[0] === value[0] && option.flip[1] === value[1]);
</script>

<div class={cn(
    "flex flex-row items-center justify-between",
    className
)}>
    <div class="text-xs uppercase tracking-wide text-neutral-300">{label}</div>
    <div class="flex flex-row items-center justify-end gap-1">
        {#each flipOptions as option, index}
            <button
                class={cn(
                    "size-6 shrink-0 transition-colors cursor-pointer rounded-sm",
                    index === flipIndex ? "text-neutral-200 bg-primary-400 p-0.5" : "text-neutral-200 bg-neutral-600/70 p-1"
                )}
                on:click={() => value = option.flip}
                aria-label={option.label}
            >
                <FlipIcon className={cn(
                    "size-full transition-all duration-150 stroke-3",
                    flipIndex === index ? "text-neutral-200" : "text-neutral-400"
                )} style="transform: {option.transform}" />
            </button>
        {/each}
    </div>
</div>