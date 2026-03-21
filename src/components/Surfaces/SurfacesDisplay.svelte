<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let className: string|undefined = undefined;
</script>

<div class={cn(
    "bg-blue-400 w-full h-full",
    "flex items-center justify-center",
    className
)}>
    DISPLAY
</div>