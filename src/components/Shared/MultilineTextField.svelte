<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let label: string | undefined = undefined;
    export let value: string = "";
    export let rows: number = 4;
    export let placeholder: string = "";
    export let className: string | undefined = undefined;
    export let onChange: (value: string) => void = () => {};
    export let onCommit: (oldValue: string, newValue: string) => void = () => {};

    let editValue = value;
    let focused = false;
    let valueOnFocus = "";

    $: if (!focused) {
        editValue = value;
    }

    function onFocus() {
        focused = true;
        valueOnFocus = value;
    }

    function commit() {
        focused = false;
        const trimmed = editValue.trim();
        editValue = trimmed;

        if (trimmed === value) {
            return;
        }

        const oldValue = value;
        value = trimmed;
        onChange(trimmed);
        onCommit(valueOnFocus.trim(), trimmed);
    }
</script>

<div class={cn("flex flex-col gap-0.5 min-w-0", className)}>
    {#if label}
        <span class="text-[0.5625rem] font-medium tracking-widest uppercase text-neutral-500">{label}</span>
    {/if}
    <textarea
        bind:value={editValue}
        {rows}
        {placeholder}
        on:focus={onFocus}
        on:blur={commit}
        class={cn(
            "w-full min-w-0 px-2.5 py-1.5 rounded-md resize-none",
            "bg-neutral-800 border border-transparent",
            "text-xs text-neutral-200 placeholder:text-neutral-500",
            "focus:outline-none focus:border-neutral-600",
            "transition-colors duration-150"
        )}
    ></textarea>
</div>
