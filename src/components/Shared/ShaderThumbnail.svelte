<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let name: string = "";
    export let className: string | undefined = undefined;

    function initials(n: string): string {
        return n.split(/[_\-\s]+/).map(w => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
    }
</script>

<div class={cn(
    "relative flex items-center justify-center overflow-hidden rounded-sm shrink-0",
    "bg-linear-to-br from-violet-900 via-purple-800 to-indigo-900",
    className
)}>
    <div class="absolute inset-0 opacity-30"
        style="background: radial-gradient(ellipse at 60% 40%, rgba(168,85,247,0.6) 0%, transparent 65%), radial-gradient(ellipse at 30% 70%, rgba(99,102,241,0.5) 0%, transparent 60%);"
    ></div>
    <span class="relative text-[0.6rem] font-semibold text-purple-200/80 select-none tracking-wider">
        {initials(name)}
    </span>
</div>
