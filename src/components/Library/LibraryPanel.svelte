<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import SegmentedControl from "../Shared/SegmentedControl.svelte";
    import DmxFixturesPanel from "./DmxFixtures/DmxFixturesPanel.svelte";
    import ShadersPanel from "./Shaders/ShadersPanel.svelte";

    export let className: string | undefined = undefined;

    const TABS = ["DMX Fixtures", "Shaders"];
    let activeTab = 0;
</script>

<div class={cn("panel flex flex-col h-full", className)}>
    <div class="shrink-0 px-4 py-3 border-b border-neutral-800">
        <SegmentedControl tabs={TABS} bind:activeTab />
    </div>

    <div class="flex-1 overflow-auto">
        {#if activeTab === 0}
            <DmxFixturesPanel />
        {:else if activeTab === 1}
            <ShadersPanel />
        {/if}
    </div>
</div>
