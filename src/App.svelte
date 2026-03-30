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

        (window as any).eventStore = eventStore;
    })

    function handleKeydown(e: KeyboardEvent) {
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const isShift = e.shiftKey;
        const isZ = e.key === "z" || e.key === "Z";
        const isY = e.key === "y" || e.key === "Y";

        // Ctrl + Z or Cmd + Z
        if (isCtrlOrMeta && isZ && !isShift) {
            e.preventDefault();
            eventStore.undo();
        }
        // Ctrl + Shift + Z or Cmd + Shift + Z or Ctrl + Y or Cmd + Y
        else if ((isCtrlOrMeta && isZ && isShift) || (isCtrlOrMeta && isY)) {
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
