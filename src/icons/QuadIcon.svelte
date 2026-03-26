<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;

    export let fillColor: string = "none";
</script>

<svg
    class={cn("stroke-current", className)}
    viewBox="0 0 24 24"
    fill={fillColor}
>
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 5 24 2 19 20 0 24 Z" />
</svg>
