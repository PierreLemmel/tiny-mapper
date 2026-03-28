<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import { surfaces } from "../../lib/stores/content";
    import { surfaceUI } from "../../lib/stores/user-interface";
    import MultipleSurfacesEditor from "./SurfaceEditor/MultipleSurfacesEditor.svelte";
    import NoSurfaceEditor from "./SurfaceEditor/NoSurfaceEditor.svelte";
    import SingleSurfaceEditor from "./SurfaceEditor/SingleSurfaceEditor.svelte";

    export let className: string|undefined = undefined;
</script>

<div class={cn(
    "flex items-stretch p-2",
    "overflow-y-auto h-full",
    className
)}>
    {#if $surfaceUI.selectedSurfaces.length === 0}
        <NoSurfaceEditor />
    {:else if $surfaceUI.selectedSurfaces.length === 1}
        <SingleSurfaceEditor bind:surface={$surfaces[$surfaceUI.selectedSurfaces[0]]} />
    {:else}
        <MultipleSurfacesEditor />
    {/if}
</div>