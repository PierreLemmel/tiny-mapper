<script lang="ts">
    import GroupIcon from "../../icons/GroupIcon.svelte";
    import QuadIcon from "../../icons/QuadIcon.svelte";
    import { cn } from "../../lib/core/utils";
    import { content } from "../../lib/stores/content";
    import Checkbox from "../Shared/Checkbox.svelte";
    import NameDisplay from "../Shared/NameDisplay.svelte";
    import VisibleCheckbox from "../Shared/VisibleCheckbox.svelte";
    import type { SurfaceDisplayTreeItem } from "./surface-tree";

    export let item: SurfaceDisplayTreeItem;

    export let isDragged: boolean = false;
    
    $: id = item.id
    $: surface = $content.surfaces[id]
    $: type = surface.type

    const INDENT_SIZE = 10;

    $: iconClasses = cn(
        "size-6 stroke-none fill-current",
        "transition-all duration-150",
        surface.enabled ? (item.selected ? "text-primary-400" : "text-secondary-400") : "text-neutral-400",
    );

    function handleClick() {
        console.log(id)
    }
</script>

<div
    class="flex flex-row justify-between items-center h-6 px-2"
>
    <div
        class="flex flex-row items-center justify-start"
        style={`padding-left: ${item.indent * INDENT_SIZE}px`}
    >
        {#if type === "Group"}
            <GroupIcon className={iconClasses} />
        {:else if type === "Quad"}
            <QuadIcon className={iconClasses} strokeWidth={0} fillColor="currentColor" />
        {/if}
        <NameDisplay bind:value={$content.surfaces[id].name} className={cn(surface.enabled ? "text-neutral-100" : "text-neutral-300")} />
    </div>

    {#if type !== "Group"}
        <div class="flex flex-row items-center justify-end pr-4">
            <VisibleCheckbox bind:visible={$content.surfaces[id].enabled} />        
        </div>
    {/if}
    </div>