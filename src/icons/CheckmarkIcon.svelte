<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;
</script>

<svg
    class={cn("size-full", className)}
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
>
    <path
        d="M2.5 6.5L5 9L9.5 3.5"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    />
</svg>
