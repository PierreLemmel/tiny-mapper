<script lang="ts">
    import { onDestroy } from "svelte";
    import { cn, clamp, circularClamp } from "../../lib/core/utils";

    export let label: string;
    export let value: number;
    export let min: number;
    export let max: number;
    export let minMaxMode: "Normal" | "Circular" = "Normal";
    export let unit: string = "";
    export let mode: "Slider" | "Infinite" = "Slider";
    export let precision: number = 2;

    export let onChange: (value: number) => void = () => {};

    export let sensitivity: number = 1;

    export let className: string | undefined = undefined;

    let scrubZoneEl: HTMLSpanElement;
    let scrubStartVal: number | null = null;
    let scrubDelta = 0;
    let scrubStartX = 0;

    let editing = false;
    let inputEl: HTMLInputElement;
    let inputText = "";

    function onScrubPointerDown(e: PointerEvent) {
        e.preventDefault();
        scrubStartVal = value;
        scrubDelta = 0;
        scrubStartX = e.clientX;

        cancelEdit();
        if (mode === "Infinite") {
            scrubZoneEl.requestPointerLock();
            document.addEventListener("pointermove", onDocPointerMove);
            document.addEventListener("pointerup", onDocPointerUp);
            document.addEventListener("pointercancel", onDocPointerUp);
        } else {
            scrubZoneEl.setPointerCapture(e.pointerId);
        }
    }

    function applyClamping(v: number) {
        if (minMaxMode === "Normal") {
            return clamp(v, min, max);
        } else {
            return circularClamp(v, min, max);
        }
    }

    function applyMovement(dx: number) {
        if (scrubStartVal === null) return;
        value = applyClamping(scrubStartVal + sensitivity * dx);
        onChange(value);
    }

    function onScrubPointerMove(e: PointerEvent) {
        if (mode === "Infinite") return;
        applyMovement(e.clientX - scrubStartX);
    }

    function onScrubPointerUp() {
        if (mode === "Infinite") return;
        scrubStartVal = null;
    }

    function onDocPointerMove(e: PointerEvent) {
        if (scrubStartVal === null) return;
        scrubDelta += e.movementX;
        applyMovement(scrubDelta);
    }

    function onDocPointerUp() {
        scrubStartVal = null;
        scrubDelta = 0;
        if (document.pointerLockElement) document.exitPointerLock();
        document.removeEventListener("pointermove", onDocPointerMove);
        document.removeEventListener("pointerup", onDocPointerUp);
        document.removeEventListener("pointercancel", onDocPointerUp);
    }

    onDestroy(() => {
        document.removeEventListener("pointermove", onDocPointerMove);
        document.removeEventListener("pointerup", onDocPointerUp);
        document.removeEventListener("pointercancel", onDocPointerUp);
        if (document.pointerLockElement === scrubZoneEl) document.exitPointerLock();
    });


    function startEditing() {
        inputText = value.toFixed(precision);
        editing = true;
        setTimeout(() => { inputEl?.select(); }, 0);
    }

    let cancelCommit = false;
    function commitEdit() {
        
        editing = false;

        if (!cancelCommit) {

            const parsed = parseFloat(inputText);
            console.log(parsed);
            if (!isNaN(parsed)) {
                value = applyClamping(parsed);
                console.log(value);
                onChange(value);
            }
        }

        cancelCommit = false;
    }

    function cancelEdit() {
        editing = false;
        cancelCommit = false;
    }

    function onInputKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            commitEdit();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            cancelEdit();
        }
    }

    $: displayValue = value.toFixed(precision);
</script>

<div
    role="spinbutton"
    aria-label={label}
    aria-valuenow={value}
    aria-valuemin={min}
    aria-valuemax={max}
    tabindex={0}
    class={cn(
        "flex flex-col gap-0.5 py-1.5 px-2 bg-neutral-800 border border-transparent rounded-md select-none transition-colors duration-150",
        editing
            ? "border-[color-mix(in_srgb,var(--color-secondary-500)_40%,transparent)]"
            : "hover:border-neutral-600",
        className
    )}
>
    <span
        bind:this={scrubZoneEl}
        role="slider"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        tabindex={-1}
        class="text-[0.5625rem] font-medium tracking-widest uppercase text-neutral-500 cursor-ew-resize"
        on:pointerdown={onScrubPointerDown}
        on:pointermove={onScrubPointerMove}
        on:pointerup={onScrubPointerUp}
        on:pointercancel={onScrubPointerUp}
    >{label}</span>
    {#if editing}
        <input
            bind:this={inputEl}
            bind:value={inputText}
            type="text"
            class="text-xs font-medium tabular-nums text-neutral-200 bg-transparent border-none outline-none p-0 w-full"
            on:blur={commitEdit}
            on:keydown={onInputKeydown}
        />
    {:else}
        <span
            role="button"
            tabindex={-1}
            class="text-xs font-medium tabular-nums text-neutral-200 cursor-text"
            on:click={startEditing}
            on:keydown={e => e.key === "Enter" && startEditing()}
        >
            {displayValue}{#if unit}<span class="text-[0.6875rem] text-neutral-500 ml-px">{unit}</span>{/if}
        </span>
    {/if}
</div>
