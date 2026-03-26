<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let className: string | undefined = undefined;
</script>

<div class={cn("h-[2px] rounded-full w-full bg-neutral-700 shrink-0", className)}></div>