<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import SegmentedControl from "../Shared/SegmentedControl.svelte";
    import VideoSettings from "../Settings/VideoSettings.svelte";
    import InputsSettings from "../Settings/InputsSettings.svelte";
    import OutputsSettings from "../Settings/OutputsSettings.svelte";
    import UISettings from "../Settings/UISettings.svelte";
    import ApplicationSettings from "../Settings/ApplicationSettings.svelte";

    export let className: string | undefined = undefined;

    const TABS = ["Application", "Video", "Inputs", "Outputs", "UI"];
    let activeTab = 0;
</script>

<div class={cn("panel flex flex-col h-full", className)}>
    <div class="shrink-0 px-4 py-3 border-b border-neutral-800">
        <SegmentedControl tabs={TABS} bind:activeTab />
    </div>

    <div class="flex-1 overflow-auto">
        {#if activeTab === 0}
            <ApplicationSettings />
        {:else if activeTab === 1}
            <VideoSettings />
        {:else if activeTab === 2}
            <InputsSettings />
        {:else if activeTab === 3}
            <OutputsSettings />
        {:else if activeTab === 4}
            <UISettings />
        {/if}
    </div>
</div>
