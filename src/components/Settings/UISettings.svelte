<script lang="ts">
    import { uiSettings } from "../../lib/stores/settings";
    import FoldableColorPicker from "../Shared/FoldableColorPicker.svelte";
    import Slider from "../Shared/Slider.svelte";
</script>

<div class="p-4 flex flex-col gap-4">
    <FoldableColorPicker
        title="Selection color"
        bind:value={$uiSettings.selectionColor}
    />
    <Slider
        label="Arrow translation speed"
        bind:value={$uiSettings.arrowTranslationSpeed}
        options={{
            type: 'value',
            min: 0.1,
            max: 100,
            step: 0.1,
        }}
    />
</div>
