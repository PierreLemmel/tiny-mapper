<script lang="ts">
    import { onMount } from "svelte";
    import { initSurfacesStores } from "./lib/stores/surfaces";
    import { globalUI, initUIStores } from "./lib/stores/user-interface";
    import TopMenuBar from "./components/Shared/TopMenuBar.svelte";
    import MappingWindow from "./components/Windows/MappingWindow.svelte";
    import OutputsWindow from "./components/Windows/OutputsWindow.svelte";
    import SettingsWindow from "./components/Windows/SettingsWindow.svelte";
    import { initRenderingStore } from "./lib/stores/rendering";
    import { registerAllEventHandlers } from "./lib/events/register-handlers";
    import { eventStore } from "./lib/events/event-store";

    onMount(async () => {
        await Promise.all([
            initSurfacesStores(),
            initUIStores(),
            initRenderingStore(),
        ]);
        registerAllEventHandlers();
    })

    function handleKeydown(e: KeyboardEvent) {
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        if (!isCtrlOrMeta) return;

        if (e.key === "z" && !e.shiftKey) {
            e.preventDefault();
            eventStore.undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
            e.preventDefault();
            eventStore.redo();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

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
