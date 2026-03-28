<script lang="ts">

    import { cn } from "../../lib/core/utils";
    import { surfaceStore } from "../../lib/stores/surfaces";
    import { surfaceUI } from "../../lib/stores/user-interface";
    import MultipleSurfacesEditor from "./SurfaceEditor/MultipleSurfacesEditor.svelte";
    import NoSurfaceEditor from "./SurfaceEditor/NoSurfaceEditor.svelte";
    import SingleSurfaceEditor from "./SurfaceEditor/SingleSurfaceEditor.svelte";

    export let className: string|undefined = undefined;

    $: surface = surfaceStore($surfaceUI.selectedSurfaces[0]);
</script>

<div class={cn(
    "flex items-stretch p-2",
    "overflow-y-auto h-full",
    className
)}>
    {#if $surfaceUI.selectedSurfaces.length === 0}
        <NoSurfaceEditor />
    {:else if $surfaceUI.selectedSurfaces.length === 1}
        <SingleSurfaceEditor bind:surface={$surface} />
    {:else if $surfaceUI.selectedSurfaces.length > 1}
        <MultipleSurfacesEditor />
    {/if}
</div>