<script lang="ts">
    import SplitPanels from "../Shared/SplitPanels.svelte";
    import { mappingUI } from "../../lib/stores/user-interface";
    import { cn } from "../../lib/core/utils";
    import EditViewPanel from "../EditView/EditViewPanel.svelte";
    import MaterialEditor from "../Materials/MaterialEditor.svelte";
    import SurfacesPanel from "../Surfaces/SurfacesPanel.svelte";
    import MaterialsPanel from "../Materials/MaterialsPanel.svelte";

    export let className: string|undefined = undefined;
</script>

{#if $mappingUI.leftPanelOpen}
<SplitPanels
    direction="horizontal" applySizeTo="first"
    bind:size={$mappingUI.leftPanelSize}
    minSize={180} maxSize={500}
    className={cn("h-full", className)}
>
    <SurfacesPanel slot="first" className="w-full h-full" />
    <div slot="second" class="w-full h-full">
        {#if $mappingUI.rightPanelOpen}
        <SplitPanels
            direction="horizontal" applySizeTo="second"
            bind:size={$mappingUI.rightPanelSize}
            minSize={180} maxSize={500}
            className={cn("h-full", className)}
        >
            <EditViewPanel slot="first" />
            <MaterialsPanel slot="second" />
        </SplitPanels>
        {:else}
        <EditViewPanel />
        {/if}
    </div>
</SplitPanels>
{:else if $mappingUI.rightPanelOpen}
<SplitPanels
    direction="horizontal" applySizeTo="second"
    bind:size={$mappingUI.rightPanelSize}
    minSize={180} maxSize={500}
    className={cn("h-full", className)}
>
    <EditViewPanel slot="first" />
    <MaterialsPanel slot="second" />
</SplitPanels>
{:else}
<EditViewPanel />
{/if}
