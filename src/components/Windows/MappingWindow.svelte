<script lang="ts">
    import SplitPanels from "../Shared/SplitPanels.svelte";
    import { surfaceUI } from "../../lib/stores/user-interface";
    import SurfaceEditor from "../Surfaces/SurfaceEditor.svelte";
    import SurfacesDisplay from "../Surfaces/SurfacesDisplay.svelte";
    import { cn } from "../../lib/core/utils";

    export let className: string|undefined = undefined;
</script>

<SplitPanels
    direction="horizontal" applySizeTo="first"
    bind:size={$surfaceUI.leftPanelSize}
    minSize={180} maxSize={500}
    className={cn("h-full", className)}
>
    <SplitPanels slot="first"
        direction="vertical" applySizeTo="second"
        bind:size={$surfaceUI.leftEditorSize}
        minSize={180} maxSize={500}
        className="w-full h-full"
    >
        <SurfacesDisplay slot="first" />
        <SurfaceEditor slot="second" />
    </SplitPanels>

    <SplitPanels slot="second"
        direction="horizontal" applySizeTo="second"
        bind:size={$surfaceUI.rightPanelSize}
        minSize={180} maxSize={500}
        className="w-full h-full"
    >
        <div slot="first">
            <div>
                <h1>SECOND</h1>
            </div>
        </div>
        <div slot="second">
            <div>
                <h1>THIRD</h1>
            </div>
        </div>
    </SplitPanels>
</SplitPanels>