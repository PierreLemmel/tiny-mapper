<script lang="ts">
    import { onMount } from "svelte";
    import { saveContentOnChange } from "./lib/stores/content";
    import { globalUI, saveUIOnChange } from "./lib/stores/user-interface";
    import TopMenuBar from "./components/Shared/TopMenuBar.svelte";
    import MappingWindow from "./components/Windows/MappingWindow.svelte";
    import OutputsWindow from "./components/Windows/OutputsWindow.svelte";
    import SettingsWindow from "./components/Windows/SettingsWindow.svelte";

    onMount(() => {
        saveContentOnChange();
        saveUIOnChange();
    })
</script>

<div class="bg-neutral-950 h-screen w-dvw flex flex-col">
    <TopMenuBar tabs={["Mapping", "Outputs", "Settings"]} bind:activeTab={$globalUI.activeTab} />

    <div class="flex-1 min-h-0">
        {#if $globalUI.activeTab === 0}
            <MappingWindow className="" />
        {:else if $globalUI.activeTab === 1}
            <OutputsWindow />
        {:else if $globalUI.activeTab === 2}
            <SettingsWindow />
        {/if}
    </div>
</div>
