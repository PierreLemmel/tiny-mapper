<script lang="ts">
    import { mappingUI } from "../../lib/stores/user-interface";
    import SplitPanels from "../Shared/SplitPanels.svelte";
    import MaterialEditor from "./MaterialEditor.svelte";
    import MaterialsDisplay from "./MaterialsDisplay.svelte";

    export let className: string | undefined = undefined;
</script>

<SplitPanels
    direction="vertical" applySizeTo="second"
    bind:size={$mappingUI.rightEditorSize}
    minSize={180} maxSize={500}
    className={className}
>
    <MaterialsDisplay slot="first" />
    <MaterialEditor slot="second" />
</SplitPanels>
