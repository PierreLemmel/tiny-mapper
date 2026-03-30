<script lang="ts">
    import IconButton from "../Shared/IconButton.svelte";
    import QuadIcon from "../../icons/QuadIcon.svelte";
    import GroupIcon from "../../icons/GroupIcon.svelte";
    import { createGroupSurface, createQuadSurface, getSurfaceInsertionPoint } from "../../lib/logic/surfaces";
    import { cn } from "../../lib/core/utils";
    import SurfaceTreeDisplay from "./SurfaceTree/SurfaceTreeDisplay.svelte";
    import { eventStore } from "../../lib/events/event-store";
    import { surfaceUI } from "../../lib/stores/user-interface";
    import { get } from "svelte/store";

    export let className: string | undefined = undefined;

    function handleCreateQuadSurface() {
        const { parentId, positionInChildren } = getSurfaceInsertionPoint(get(surfaceUI).selectedSurfaces);
        const surface = createQuadSurface({ parentId }, positionInChildren);
        eventStore.push({
            category: "Surface",
            type: "Created",
            forwardData: { surface: structuredClone(surface) },
            backwardData: { surfaceId: surface.id },
        })
    }

    function handleCreateGroupSurface() {
        const { parentId, positionInChildren } = getSurfaceInsertionPoint(get(surfaceUI).selectedSurfaces);
        const surface = createGroupSurface({ parentId }, positionInChildren);
        eventStore.push({
            category: "Surface",
            type: "Created",
            forwardData: { surface: structuredClone(surface) },
            backwardData: { surfaceId: surface.id },
        })
    }
</script>

<div class={cn(
    "w-full h-full",
    "flex flex-col items-stretch justify-center",
    "gap-2 pt-1.5",
    className
)}
>
    <div class="flex flex-row flex-wrap gap-2 items-center justify-center my-3">
        <IconButton variant="primary" onClick={handleCreateQuadSurface} size="large">
            <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                <QuadIcon />
            </span>
        </IconButton>
        <IconButton variant="primary" onClick={handleCreateGroupSurface} size="large">
            <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                <GroupIcon className="stroke-[1px]" />
            </span>
        </IconButton>
    </div>
    <SurfaceTreeDisplay className="flex-1" />
</div>
