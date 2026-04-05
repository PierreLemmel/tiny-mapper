<script lang="ts">
    import { mappingUI } from "../../lib/stores/user-interface";
    import SplitPanels from "../Shared/SplitPanels.svelte";
    import EditViewPanel from "./EditViewPanel.svelte";
    import CuePanel from "../Cue/CuePanel.svelte";

    export let className: string | undefined = undefined;
</script>

{#if $mappingUI.bottomPanelOpen}
<SplitPanels
    direction="vertical" applySizeTo="second"
    bind:size={$mappingUI.bottomPanelSize}
    minSize={150} maxSize={600}
    className={className}
>
    <EditViewPanel slot="first" className="w-full h-full" />
    <CuePanel slot="second" />
</SplitPanels>
{:else}
<EditViewPanel className={className} />
{/if}
