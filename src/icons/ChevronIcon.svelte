<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;
</script>

<svg
    class={cn(className)}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
>
    <polyline points="6 9 12 15 18 9" />
</svg>
