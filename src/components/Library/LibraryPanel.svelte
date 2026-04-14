<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import { libraryUI } from "../../lib/stores/user-interface";
    import SegmentedControl from "../Shared/SegmentedControl.svelte";
    import DmxFixturesPanel from "./DmxFixtures/DmxFixturesPanel.svelte";
    import ShadersPanel from "./Shaders/ShadersPanel.svelte";

    export let className: string | undefined = undefined;

    const TABS = ["Shaders", "DMX Fixtures"];
</script>

<div class={cn("panel flex flex-col h-full", className)}>
    <div class="shrink-0 px-4 py-3 border-b border-neutral-800">
        <SegmentedControl tabs={TABS} bind:activeTab={$libraryUI.activeTab} />
    </div>

    <div class="flex-1 overflow-auto">
        {#if $libraryUI.activeTab === 0}
            <ShadersPanel />
        {:else if $libraryUI.activeTab === 1}
            <DmxFixturesPanel />
        {/if}
    </div>
</div>
