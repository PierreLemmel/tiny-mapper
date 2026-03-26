<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let className: string | undefined = undefined;
</script>

<div class={cn("w-px h-full bg-neutral-800 shrink-0", className)}></div>