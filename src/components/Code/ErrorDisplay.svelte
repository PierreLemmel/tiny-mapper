<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import ErrorDisplayCategory from "./ErrorDisplayCategory.svelte";

    export let errors: {
        category: string;
        errors: string[];
    }[];
    export let className: string | undefined = undefined;
    export let successMessage: string = "No errors";

    $: hasErrors = errors.length > 0;
</script>

<div class={cn(
    "flex flex-col gap-2 py-0.5 px-1",
    "text-sm font-medium",
    "text-neutral-400",
    "overflow-auto",
    className
)}>
    {#if hasErrors}
        {#each errors as error}
            <ErrorDisplayCategory category={error.category} errors={error.errors} />
        {/each}
    {:else}
        <div class="text-neutral-500">{successMessage}</div>
    {/if}
</div>
