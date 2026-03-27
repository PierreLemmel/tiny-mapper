<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let className: string | undefined = undefined;
</script>

<div class={cn("flex flex-col w-full h-full min-w-0 min-h-0", className)}>
    <div>LIBRARY</div>
</div>