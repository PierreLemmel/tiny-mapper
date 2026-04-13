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
    <Slider
        label="Selection outline thickness"
        bind:value={$uiSettings.selectionOutlineThickness}
        options={{
            type: 'value',
            min: 0,
            max: 20,
            step: 0.1,
        }}
    />
    <Slider
        label="Handles size"
        bind:value={$uiSettings.handlesSize}
        options={{
            type: 'value',
            min: 1,
            max: 40,
            step: 1,
        }}
    />
    <FoldableColorPicker
        title="Selected handle color"
        bind:value={$uiSettings.handlesSelectedColor}
    />
    <FoldableColorPicker
        title="Unselected handle color"
        bind:value={$uiSettings.handlesUnselectedColor}
    />
</div>
