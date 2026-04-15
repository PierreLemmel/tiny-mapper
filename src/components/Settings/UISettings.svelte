<script lang="ts">
    import { uiSettings } from "../../lib/stores/settings";
    import Slider from "../Shared/Slider.svelte";
</script>

<div class="p-4 flex flex-col gap-4">
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
