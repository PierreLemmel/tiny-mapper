<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import { createGroupSurface, createQuadSurface } from "../../lib/logic/surfaces";
    import IconButton from "../Shared/IconButton.svelte";

    export let className: string|undefined = undefined;

</script>

<div class={cn(
    "bg-neutral-700",
    "flex flex-col gap-2",
    className
)}>
    <IconButton onClick={createQuadSurface} description="Create Quad" />
    <IconButton onClick={createGroupSurface} description="Create Group" />
</div>