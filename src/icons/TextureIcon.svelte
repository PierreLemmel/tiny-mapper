<script lang="ts">
    import { cn } from "../lib/core/utils";

    export let className: string | undefined = undefined;

    const offsetSet = 12;
    const startY = 6;
    const count = 4;
</script>

<svg
    class={cn("stroke-current overflow-hidden", className)}
    viewBox="0 0 24 24"
    fill="none"
    
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
>
    {#each Array.from({ length: count }) as _, i}
        <line stroke-width="3" x1="0" y1={startY + i * offsetSet} x2="24" y2={startY - 24 + i * offsetSet} />
    {/each}
</svg>
