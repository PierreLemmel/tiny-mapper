<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let value: string;
    export let onChange: (newValue: string) => void = () => {};
    export let editable: boolean = true;
    export let className: string | undefined = undefined;

    let editing = false;
    let inputEl: HTMLInputElement;
    let editValue = value;

    function startEditing() {
        if (!editable) return;
        editing = true;
        editValue = value;
        requestAnimationFrame(() => {
            inputEl?.focus();
            inputEl?.select();
        });
    }

    function commit() {
        editing = false;
        const trimmed = editValue.trim();
        if (trimmed && trimmed !== value) {
            value = trimmed;
            onChange(trimmed);
        }
        editValue = value;
    }

    function onKeyDown(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit();
        } else if (e.key === 'Escape') {
            editing = false;
            editValue = value;
        }
    }
</script>

{#if editing}
    <input
        bind:this={inputEl}
        bind:value={editValue}
        on:blur={commit}
        on:keydown={onKeyDown}
        class={cn(
            "bg-black text-neutral-100 font-medium text-sm",
            "w-full px-1.5 py-0.5 rounded-sm",
            "border-b-2 border-primary-400 outline-none",
            className
        )}
    />
{:else}
    <button
        class={cn(
            "font-medium text-neutral-100 truncate text-left w-full text-sm",
            "px-1.5 py-0.5 rounded-sm",
            "transition-colors duration-150",
            editable && "hover:bg-neutral-800/60 cursor-text",
            !editable && "cursor-default",
            className
        )}
        on:dblclick={startEditing}
        title={editable ? "Double-click to rename" : undefined}
    >
        {value}
    </button>
{/if}
