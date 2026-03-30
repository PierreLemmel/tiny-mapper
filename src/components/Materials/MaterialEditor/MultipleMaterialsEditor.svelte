<script lang="ts">
    import { cn } from "../../../lib/core/utils";

    export let className: string|undefined = undefined;
</script>

<div class={cn(
    className,
    "w-full h-full flex items-center justify-center",
    "text-neutral-200",
)}>
    <div>Multiple materials selected.</div>
</div>
