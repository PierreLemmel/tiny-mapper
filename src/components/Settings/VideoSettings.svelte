<script lang="ts">
    import { resetVideoSettings } from "../../lib/stores/settings";
    import SettingsPanelReset from "./SettingsPanelReset.svelte";
</script>

<div class="p-4 flex flex-col gap-4">
    <div class="text-neutral-400 text-sm">
        Video settings
    </div>
    <SettingsPanelReset onReset={resetVideoSettings} />
</div>
