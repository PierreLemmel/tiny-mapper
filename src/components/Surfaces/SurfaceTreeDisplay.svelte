<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';

    import { cn } from "../../lib/core/utils";
    import { surfaceDisplayTree } from "./surface-tree";
    import SurfaceTreeDisplayItem from "./SurfaceTreeDisplayItem.svelte";

    export let className: string|undefined = undefined;

    function handleDndConsider(e: Event) {
        console.log("consider", e)
    }

    function handleDndFinalize(e: any) {
        console.log("finalize", e)
    }
</script>

<div class={cn(
    "flex flex-col items-stretch justify-start gap-1.5 overflow-y-auto max-h-full",
    className
)}
    use:dndzone={{ items: $surfaceDisplayTree, flipDurationMs: 150 }}
    on:consider={handleDndConsider}
    on:finalize={handleDndFinalize}
>
    {#each $surfaceDisplayTree as item (item.id)}
    <div class="w-full flex flex-col items-stretch" animate:flip={{ duration: 150 }}>
        <SurfaceTreeDisplayItem {item} />
    </div>    
    {/each}
</div>