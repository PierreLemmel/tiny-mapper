<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;
    export let strokeWidth: number = 1;
    export let fillColor: string = "none";
</script>

<svg
    class={cn(className)}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    stroke="currentColor"
    fill="none"
    stroke-width="1"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
>
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
</svg>
