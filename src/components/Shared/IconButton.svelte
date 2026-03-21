<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let className: string|undefined = undefined;
    export let onClick: () => void = () => {}

    export let description: string;
</script>

<button class={cn(
        className
    )}
    on:click={onClick}
>
    {description}
</button>