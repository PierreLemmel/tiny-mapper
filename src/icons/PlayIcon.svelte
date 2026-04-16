<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;
</script>

<svg
    class={cn("fill-current", className)}
    viewBox="0 0 24 24"
    aria-hidden="true"
>
    <path d="M8 5v14l11-7-11-7z" />
</svg>
