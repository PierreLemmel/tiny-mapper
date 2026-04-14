<script lang="ts">
    import { cn } from "../../../lib/core/utils";
    import { libraryUI } from "../../../lib/stores/user-interface";

    export let className: string | undefined = undefined;
</script>

<div class={cn(
    "bg-neutral-900/80 rounded-md",
    "flex items-center justify-center flex-col",
    "p-1 gap-1",
    "pointer-events-none",
    className
)}>
    <div class="text-neutral-100/70 text-xs tracking-wider uppercase"> Preview</div>
    <div class={cn(
        "w-50 h-35",
        "rounded-sm",
        "bg-linear-to-br from-violet-900 via-purple-800 to-indigo-900",
    )}></div>
</div>