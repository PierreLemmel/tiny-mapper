<script lang="ts">
    import { mappingUI } from "../../lib/stores/user-interface";
    import SplitPanels from "../Shared/SplitPanels.svelte";
    import SurfaceEditor from "./SurfaceEditor.svelte";
    import SurfacesDisplay from "./SurfacesDisplay.svelte";

    export let className: string | undefined = undefined;
</script>

<SplitPanels
    direction="vertical" applySizeTo="second"
    bind:size={$mappingUI.leftEditorSize}
    minSize={180} maxSize={500}
    className={className}
>
    <SurfacesDisplay slot="first" />
    <SurfaceEditor slot="second" />
</SplitPanels>