<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import MaterialTreeDisplay from "./MaterialTree/MaterialTreeDisplay.svelte";

    export let className: string | undefined = undefined;
</script>

<div class={cn(
    "panel w-full h-full",
    "flex flex-col items-stretch justify-center",
    className
)}>
    <MaterialTreeDisplay className="flex-1 min-h-0" />
</div>
