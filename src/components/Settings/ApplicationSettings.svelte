<script lang="ts">
    import { applicationSettings, resetApplicationSettings } from "../../lib/stores/settings";
    import { LogLevel } from "../../lib/logging/logger";
    import Dropdown from "../Shared/Dropdown.svelte";
    import Slider from "../Shared/Slider.svelte";
    import SettingsPanelReset from "./SettingsPanelReset.svelte";

    const LOG_LEVEL_OPTIONS = [
        { value: LogLevel.Verbose, label: "Verbose" },
        { value: LogLevel.Debug, label: "Debug" },
        { value: LogLevel.Info, label: "Info" },
        { value: LogLevel.Warn, label: "Warn" },
        { value: LogLevel.Error, label: "Error" },
    ];
</script>

<div class="p-4 flex flex-col gap-4">
    <div class="flex flex-col gap-1.5 py-1">
        <span class="text-[0.6875rem] font-medium tracking-widest uppercase text-neutral-350">
            Log level
        </span>
        <Dropdown
            options={LOG_LEVEL_OPTIONS}
            bind:value={$applicationSettings.logLevel}
        />
    </div>
    <Slider
        label="Refresh rate"
        bind:value={$applicationSettings.refreshRate}
        options={{
            type: 'value',
            min: 10,
            max: 120,
            step: 1,
            unit: ' Hz',
        }}
    />
    <SettingsPanelReset onReset={resetApplicationSettings} />
</div>
