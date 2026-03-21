<script lang="ts">
    import { onMount } from "svelte";
    import SurfacePanel from "./components/Surfaces/SurfacePanel.svelte";
    import SurfacesDisplay from "./components/Surfaces/SurfacesDisplay.svelte";
    import { cn } from "./lib/core/utils";
    import { saveContentOnChange } from "./lib/stores/content";
    import { saveUIOnChange } from "./lib/stores/user-interface";

    onMount(() => {
        saveContentOnChange();
        saveUIOnChange();
    })
</script>

<main class="h-dvh w-dvw bg-neutral-950 text-neutral-100">
    <div class={cn(
        "w-full h-full flex flex-row justify-around items-stretch",
        ""
    )}>
        <div class={cn("min-w-[250px] max-w-lg")}>
            <SurfacePanel />
        </div>
        <div class={cn("flex-3")}>
            <SurfacesDisplay />
        </div>
    </div>
</main>