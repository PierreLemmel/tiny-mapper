<script lang="ts">
    import { uiSettings } from "../../lib/stores/settings";
    import FoldableColorPicker from "../Shared/FoldableColorPicker.svelte";
</script>

<div class="p-4 flex flex-col gap-4">
    <FoldableColorPicker
        title="Selection color"
        bind:value={$uiSettings.selectionColor}
    />
</div>
