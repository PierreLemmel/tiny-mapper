<script lang="ts">
    import type { Writable } from "svelte/store";
    import type { SurfaceGeometry } from "../../lib/logic/surfaces/surfaces";
    import { cn } from "../../lib/core/utils";
    import PositionEditor from "./PositionEditor.svelte";
    import { uiSettings } from "../../lib/stores/settings";
    import type { Position } from "../../lib/logic/mapping";

    export let className: string|undefined = undefined;

    export let geometry: Writable<SurfaceGeometry>;

    export let onVertexCommit: (index: number, oldValue: Position, newValue: Position) => void = () => {};
</script>

<div class={cn("flex flex-col gap-2 items-stretch w-full py-2 mb-4", className)}>
    <div class="flex flex-col gap-2.5">
        {#each $geometry.vertices as vertex, index}
            <PositionEditor
                label={`Vertex ${index}`}
                bind:value={vertex}
                sensitivity={$uiSettings.geometryEditorSensitivity}
                onCommit={(oldValue, newValue) => {
                    onVertexCommit(index, oldValue, newValue);
                }}
            />
        {/each}
    </div>
</div>