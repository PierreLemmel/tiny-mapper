<script module lang="ts">
    export type DropdownOption<T extends string | number = string> = {
        value: T;
        label: string;
        disabled?: boolean;
    };
</script>

<script lang="ts" generics="T extends string | number">
    import { onDestroy } from "svelte";
    import { inputManager } from "../../lib/ui/inputs/input-manager";
    import { cn, createId } from "../../lib/core/utils";
    import ChevronIcon from "../../icons/ChevronIcon.svelte";

    export let options: DropdownOption<T>[] = [];
    export let value: T | undefined = undefined;
    export let placeholder: string = "Select…";
    export let disabled: boolean = false;
    export let className: string | undefined = undefined;
    export let onChange: (value: T) => void = () => {};
    export let onCommit: (oldValue: T | undefined, newValue: T) => void = () => {};

    let open = false;
    let container: HTMLDivElement | undefined;
    let listboxId = createId();

    $: selectedLabel =
        value !== undefined
            ? options.find((o) => o.value === value)?.label ?? placeholder
            : placeholder;

    function close() {
        open = false;
        document.removeEventListener("click", onDocumentClick);
    }

    function onDocumentClick(event: MouseEvent) {
        const target = event.target as Node;
        if (container && !container.contains(target)) {
            close();
        }
    }

    function scheduleOutsideClose() {
        setTimeout(() => {
            document.addEventListener("click", onDocumentClick);
        }, 0);
    }

    function toggle() {
        if (disabled) return;
        if (open) {
            close();
        } else {
            open = true;
            scheduleOutsideClose();
        }
    }

    function selectOption(option: DropdownOption<T>) {
        if (option.disabled) return;
        const oldValue = value;
        value = option.value;
        onChange(option.value);
        onCommit(oldValue, option.value);
        close();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        close();
    }

    onDestroy(() => {
        document.removeEventListener("click", onDocumentClick);
    });
</script>

<svelte:window on:keydown={onKeydown} />

<div bind:this={container} class={cn("relative inline-block min-w-32", className)}>
    <button
        type="button"
        class={cn(
            "inline-flex w-full items-center justify-between gap-2",
            "text-[0.6875rem] font-medium tracking-[0.05em] uppercase",
            "transition-all duration-150 select-none",
            "rounded-md px-3.5 py-1.5",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-secondary-500",
            "bg-neutral-800 text-neutral-200 border border-transparent",
            "hover:border-secondary-500/40 hover:text-neutral-100 active:bg-neutral-700",
            disabled && "opacity-40 pointer-events-none",
            open && "border-secondary-500/40 text-neutral-100"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        {disabled}
        on:click|stopPropagation={toggle}
    >
        <span class="truncate text-left">{selectedLabel}</span>
        <span
            class={cn(
                "inline-flex size-4 shrink-0 transition-transform duration-150 [&_svg]:size-full",
                open && "rotate-180"
            )}
            aria-hidden="true"
        >
            <ChevronIcon />
        </span>
    </button>

    {#if open}
        <ul
            id={listboxId}
            role="listbox"
            class={cn(
                "absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto",
                "rounded-md border border-neutral-700 bg-neutral-900 py-1 shadow-lg",
                "text-[0.6875rem] font-medium tracking-[0.03em]"
            )}
        >
            {#each options as option}
                <li role="presentation">
                    <button
                        type="button"
                        role="option"
                        aria-selected={value === option.value}
                        class={cn(
                            "flex w-full items-center px-3.5 py-2 text-left uppercase",
                            "transition-colors duration-150",
                            "hover:bg-neutral-800 focus-visible:bg-neutral-800 focus-visible:outline-none",
                            value === option.value && "bg-neutral-800/80 text-neutral-100",
                            option.disabled && "pointer-events-none opacity-40",
                            !option.disabled && value !== option.value && "text-neutral-300"
                        )}
                        disabled={option.disabled}
                        on:click|stopPropagation={() => selectOption(option)}
                    >
                        {option.label}
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>
