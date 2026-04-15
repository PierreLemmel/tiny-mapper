<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { initSurfacesStores } from "./lib/stores/surfaces";
    import { initMaterialsStores } from "./lib/stores/materials";
    import { globalUI, initUIStores } from "./lib/stores/user-interface";
    import TopMenuBar from "./components/Shared/TopMenuBar.svelte";
    import MappingWindow from "./components/Windows/MappingWindow.svelte";
    import OutputsWindow from "./components/Windows/OutputsWindow.svelte";
    import LibraryWindow from "./components/Windows/LibraryWindow.svelte";
    import SettingsWindow from "./components/Windows/SettingsWindow.svelte";
    import { initRenderingStore } from "./lib/stores/rendering";
    import { initSettingsStores } from "./lib/stores/settings";
    import { initMaterialTemplatesStores } from "./lib/stores/material-templates";
    import { registerAllEventHandlers } from "./lib/events/register-handlers";
    import { eventStore } from "./lib/events/event-store";
    import { inputManager } from "./lib/ui/inputs/input-manager";
    import { application } from "./lib/stores/application";
    import LoadingWindow from "./components/Windows/LoadingWindow.svelte";
    import { registerGlobalHandlers, unregisterGlobalHandlers } from "./lib/ui/inputs/global-handlers";
    import RenderingContext from "./components/Rendering/RenderingContext.svelte";

    onMount(async () => {
        await initMaterialTemplatesStores();
        await Promise.all([
            initSurfacesStores(),
            initMaterialsStores(),
            initUIStores(),
            initRenderingStore(),
            initSettingsStores(),
        ]);
        registerAllEventHandlers();

        (window as any).eventStore = eventStore;
        (window as any).inputManager = inputManager;

        application.update(state => ({ ...state, loaded: true }));

        registerGlobalHandlers();

    })

    onDestroy(() => {
        unregisterGlobalHandlers();
    });

</script>

<svelte:window
    on:keydown={e => inputManager.handleKeyDown(e)}
    on:keyup={e => inputManager.handleKeyUp(e)}
/>

<div class="bg-neutral-950 h-screen w-dvw flex flex-col">
    {#if $application.loaded}
    <TopMenuBar tabs={["Mapping", "Outputs", "Library", "Settings"]} bind:activeTab={$globalUI.activeTab} />

    <div class="flex-1 min-h-0 relative">
        <RenderingContext className="absolute inset-0 w-full h-full" />
        <div class="absolute inset-0 w-full h-full">
            {#if $globalUI.activeTab === 0}
                <MappingWindow className="" />
            {:else if $globalUI.activeTab === 1}
                <OutputsWindow />
            {:else if $globalUI.activeTab === 2}
                <LibraryWindow />
            {:else if $globalUI.activeTab === 3}
                <SettingsWindow />
            {/if}
        </div>
    </div>
    {:else}
    <LoadingWindow />
    {/if}
</div>
