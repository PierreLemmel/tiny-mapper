<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import SurfaceEditor from "./SurfaceEditor.svelte";
    import SurfacesToolbar from "./SurfacesToolbar.svelte";
    import SurfaceTreeDisplay from "./SurfaceTreeDisplay.svelte";

    export let className: string|undefined = undefined;
</script>

<div class={cn(
    "bg-neutral-800 w-full h-full",
    "flex flex-col items-stretch justify-center",
    className
)}>
    <div class="text-2xl text-white text-center">Surfaces</div>
    <div class={cn(
        "flex-1",
        "flex flex-row items-stretch justify-around"
    )}>
        <SurfacesToolbar />
        <SurfaceTreeDisplay className="flex-1" />
    </div>
    <SurfaceEditor className="flex-1" />
</div>