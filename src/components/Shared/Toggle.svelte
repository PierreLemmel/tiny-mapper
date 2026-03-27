<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let value: boolean = false;
    export let onChange: (value: boolean) => void = () => {};
    export let label: string;
    export let type: 'primary' | 'secondary' = 'secondary';

    function toggle() {
        value = !value;
        onChange(!value);
    }
</script>

<button
    class={cn(
        "flex items-center justify-center gap-1 rounded-sm",
        "size-6 shrink-0 p-1 transition-colors cursor-pointer",
        "text-neutral-200",
        value ? (type === 'primary' ? "bg-primary-400" : "bg-secondary-400"): "bg-neutral-600/70",
    )}
    on:click|stopPropagation={toggle}
    aria-label={label}
>
    <slot />
</button>