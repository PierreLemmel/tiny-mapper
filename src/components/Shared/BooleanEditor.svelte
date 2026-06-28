<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import Checkbox from "./Checkbox.svelte";

    export let label: string;
    export let value: boolean = false;
    export let disabled: boolean = false;
    export let className: string | undefined = undefined;
    export let onChange: (value: boolean) => void = () => {};
    export let onCommit: (oldValue: boolean, newValue: boolean) => void = () => {};

    function toggle() {
        if (disabled) {
            return;
        }
        const oldValue = value;
        value = !value;
        onChange(value);
        onCommit(oldValue, value);
    }
</script>

<div
    role="none"
    class={cn(
        "flex flex-row gap-0.5 py-1.5 items-center justify-between",
        "border border-transparent rounded-md select-none transition-colors duration-150",
        "outline-none focus:outline-none focus-visible:outline-none",
        !disabled && "cursor-pointer",
        disabled && "opacity-40 pointer-events-none",
        className
    )}
    on:click={toggle}
    on:keydown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
        }
    }}
>
    <span class="text-[0.6875rem] font-medium tracking-widest uppercase text-neutral-350 select-none">{label}</span>
    <Checkbox checked={value} {disabled} className="pointer-events-none outline-none focus:outline-none focus-visible:outline-none" />
</div>
