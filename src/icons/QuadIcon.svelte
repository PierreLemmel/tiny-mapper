<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;

    export let strokeWidth: number = 1.2;
    export let fillColor: string = "none";
</script>

<svg
    class={cn("stroke-current", className)}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    stroke-width={strokeWidth}
    fill={fillColor}
>
    <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
    />
</svg>
