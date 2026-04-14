<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let open: boolean = false;
    export let title: string = "";
    export let message: string = "";
    export let confirmLabel: string = "Confirm";
    export let cancelLabel: string = "Cancel";
    export let onConfirm: () => void = () => {};
    export let onCancel: () => void = () => {};

    function close() {
        open = false;
        onCancel();
    }

    function confirm() {
        onConfirm();
        open = false;
    }

    function backdropMousedown(e: MouseEvent) {
        if (e.target === e.currentTarget) close();
    }
</script>

<svelte:window on:keydown={(e) => open && e.key === "Escape" && close()} />

{#if open}
<div
    class="fixed inset-0 z-100 flex items-center justify-center bg-black/55 p-4"
    on:mousedown={backdropMousedown}
    role="presentation"
>
    <div
        class={cn(
            "w-full max-w-sm flex flex-col gap-4 rounded-xl",
            "bg-neutral-900 border border-neutral-700 shadow-xl p-4",
        )}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="validation-popup-title"
        aria-describedby="validation-popup-desc"
        tabindex="-1"
        on:mousedown|stopPropagation
    >
        <div id="validation-popup-title" class="text-xs uppercase tracking-wide text-neutral-300">
            {title}
        </div>
        <p id="validation-popup-desc" class="text-sm text-neutral-400 leading-relaxed">
            {message}
        </p>
        <div class="flex flex-row items-center justify-end gap-2 shrink-0">
            <button
                type="button"
                class={cn(
                    "px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-wider rounded-md",
                    "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors duration-150",
                )}
                on:click={close}
            >
                {cancelLabel}
            </button>
            <button
                type="button"
                class={cn(
                    "px-3 py-1.5 text-[0.625rem] font-medium uppercase tracking-wider rounded-md",
                    "bg-red-600/90 text-neutral-100 hover:bg-red-500 transition-colors duration-150",
                )}
                on:click={confirm}
            >
                {confirmLabel}
            </button>
        </div>
    </div>
</div>
{/if}
