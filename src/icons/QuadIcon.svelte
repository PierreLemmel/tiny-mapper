<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;

    export let strokeWidth: number = 1.2;
    export let fillColor: string = "none";
</script>

<svg
    class={cn("stroke-current", className)}
    viewBox="0 0 24 24"
    stroke-width={strokeWidth}
    fill={fillColor}
>
    <!-- <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
    /> -->
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 5 24 2 19 20 0 24 Z" />
</svg>
