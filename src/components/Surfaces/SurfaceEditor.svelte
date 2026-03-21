<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let className: string|undefined = undefined;

</script>

<div class={cn(
    "bg-emerald-500",
    className
)}>
    EDITOR
</div>