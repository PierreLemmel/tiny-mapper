<script module lang="ts">
    export type ColorPickerMode = "hsv" | "rgb" | "hex";
</script>

<script lang="ts">
    import { cn, clamp } from "../../lib/core/utils";
    import {
        hueToRgbString,
            type RawColor,
        rawColorToRgba,
        rawColorToHex,
        rawColorToHsva,
        hsvaToRawColor,
        hexToRawColor,
    } from "../../lib/core/color";
    import Scrubber from "./Scrubber.svelte";
    import type { RawColor as RawColorType } from "../../lib/core/color";

    export let value: RawColor = [1, 1, 1, 1];
    export let className: string | undefined = undefined;
    export let onCommit: (oldValue: RawColor, newValue: RawColor) => void = () => {};

    let commitStartColor: RawColorType | null = null;

    function captureStart() { commitStartColor = [...value] as RawColorType; }
    function fireCommit() {
        if (commitStartColor !== null) {
            const old = commitStartColor;
            commitStartColor = null;
            if (old[0] !== value[0] || old[1] !== value[1] || old[2] !== value[2] || old[3] !== value[3]) {
                onCommit(old, value);
            }
        }
    }

    const modes: ColorPickerMode[] = ["hsv", "rgb", "hex"];
    export let mode: ColorPickerMode = "hsv";

    let areaEl: HTMLDivElement;
    let hueTrack: HTMLDivElement;
    let rTrack: HTMLDivElement;
    let gTrack: HTMLDivElement;
    let bTrack: HTMLDivElement;

    let hexInput = "";
    let hexFocused = false;

    $: hsva = rawColorToHsva(value);
    $: rgba = rawColorToRgba(value);
    $: hex = rawColorToHex(value);
    $: if (!hexFocused) hexInput = hex;
    $: hueRgb = hueToRgbString(hsva.h);

    function areaDown(e: PointerEvent) { captureStart(); areaEl.setPointerCapture(e.pointerId); areaUpdate(e); }
    function areaMove(e: PointerEvent) { if (areaEl.hasPointerCapture(e.pointerId)) areaUpdate(e); }
    function areaUpdate(e: PointerEvent) {
        const r = areaEl.getBoundingClientRect();
        const s = clamp((e.clientX - r.left) / r.width, 0, 1) * 100;
        const v = (1 - clamp((e.clientY - r.top) / r.height, 0, 1)) * 100;
        value = hsvaToRawColor({ ...hsva, s, v });
    }

    function trackRatio(el: HTMLDivElement, e: PointerEvent): number {
        const r = el.getBoundingClientRect();
        return clamp((e.clientX - r.left) / r.width, 0, 1);
    }
    function td(el: HTMLDivElement, e: PointerEvent, cb: (r: number) => void) {
        captureStart();
        el.setPointerCapture(e.pointerId);
        cb(trackRatio(el, e));
    }
    function tm(el: HTMLDivElement, e: PointerEvent, cb: (r: number) => void) {
        if (el.hasPointerCapture(e.pointerId)) cb(trackRatio(el, e));
    }

    function hDown(e: PointerEvent) { td(hueTrack, e, r => { value = hsvaToRawColor({ ...hsva, h: r * 360 }); }); }
    function hMove(e: PointerEvent) { tm(hueTrack, e, r => { value = hsvaToRawColor({ ...hsva, h: r * 360 }); }); }

    function rDown(e: PointerEvent) { td(rTrack, e, r => { value = [r, value[1], value[2], 1]; }); }
    function rMove(e: PointerEvent) { tm(rTrack, e, r => { value = [r, value[1], value[2], 1]; }); }
    function gDown(e: PointerEvent) { td(gTrack, e, r => { value = [value[0], r, value[2], 1]; }); }
    function gMove(e: PointerEvent) { tm(gTrack, e, r => { value = [value[0], r, value[2], 1]; }); }
    function bDown(e: PointerEvent) { td(bTrack, e, r => { value = [value[0], value[1], r, 1]; }); }
    function bMove(e: PointerEvent) { tm(bTrack, e, r => { value = [value[0], value[1], r, 1]; }); }

    function commitHex() {
        hexFocused = false;
        const parsed = hexToRawColor(hexInput);
        if (!parsed) { hexInput = hex; return; }
        const old: RawColorType = [...value] as RawColorType;
        value = [parsed[0], parsed[1], parsed[2], 1];
        if (old[0] !== value[0] || old[1] !== value[1] || old[2] !== value[2] || old[3] !== value[3]) {
            onCommit(old, value);
        }
    }
    function hexKeydown(e: KeyboardEvent) { if (e.key === "Enter") commitHex(); }
</script>

<div class={cn("flex flex-col w-full", className)}>
    <div class="flex shrink-0 bg-neutral-900">
        {#each modes as m}
            <button
                class={cn(
                    "relative flex-1 h-9 text-[0.6875rem] font-medium tracking-widest uppercase cursor-pointer",
                    "transition-colors duration-150",
                    mode === m ? "text-secondary-400" : "text-neutral-500 hover:text-neutral-300"
                )}
                on:click={() => { mode = m; }}
            >
                {m}
                {#if mode === m}
                    <span class="absolute bottom-0 left-3 right-3 h-[2px] bg-secondary-400 rounded-full"></span>
                {/if}
            </button>
        {/each}
    </div>

    <div class="flex flex-col gap-3 p-3">
        <div
            bind:this={areaEl}
            class="relative w-full aspect-5/3 rounded-sm overflow-hidden cursor-crosshair touch-none"
            style="background: {hueRgb}"
            on:pointerdown={areaDown}
            on:pointermove={areaMove}
            on:lostpointercapture={fireCommit}
            role="slider"
            tabindex={0}
            aria-label="Saturation and brightness"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={hsva.s}
        >
            <div class="absolute inset-0 sv-white"></div>
            <div class="absolute inset-0 sv-black"></div>
            <div
                class="absolute size-3 rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style="left: {hsva.s}%; top: {100 - hsva.v}%; box-shadow: 0 0 0 1px rgba(0,0,0,0.4)"
            ></div>
        </div>

        {#if mode === "hsv"}
            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <span class="track-label">Hue</span>
                    <span class="track-value">{Math.round(hsva.h)}°</span>
                </div>
                <div class="relative h-3 rounded-sm overflow-hidden">
                    <div
                        bind:this={hueTrack}
                        class="absolute inset-0 hue-gradient cursor-pointer touch-none"
                        on:pointerdown={hDown}
                        on:pointermove={hMove}
                        on:lostpointercapture={fireCommit}
                        role="slider"
                        tabindex={0}
                        aria-label="Hue"
                        aria-valuemin={0}
                        aria-valuemax={360}
                        aria-valuenow={hsva.h}
                    >
                        <div class="thumb" style="left: {(hsva.h / 360) * 100}%"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
                <Scrubber
                    label="Saturation"
                    value={hsva.s}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={v => { value = hsvaToRawColor({ ...hsva, s: v }); }}
                    onCommit={(oldS) => {
                        const oldColor = hsvaToRawColor({ ...hsva, s: oldS });
                        onCommit(oldColor, value);
                    }}
                />
                <Scrubber
                    label="Brightness"
                    value={hsva.v}
                    min={0}
                    max={100}
                    unit="%"
                    onChange={v => { value = hsvaToRawColor({ ...hsva, v: v }); }}
                    onCommit={(oldV) => {
                        const oldColor = hsvaToRawColor({ ...hsva, v: oldV });
                        onCommit(oldColor, value);
                    }}
                />
            </div>

        {:else if mode === "rgb"}
            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <span class="track-label">R</span>
                    <span class="track-value">{Math.round(rgba.r)}</span>
                </div>
                <div class="relative h-3 rounded-sm overflow-hidden">
                    <div
                        bind:this={rTrack}
                        class="absolute inset-0 cursor-pointer touch-none rounded-sm"
                        style="background: linear-gradient(to right,  black, red)"
                        on:pointerdown={rDown}
                        on:pointermove={rMove}
                        on:lostpointercapture={fireCommit}
                        role="slider"
                        tabindex={0}
                        aria-label="Red"
                        aria-valuemin={0}
                        aria-valuemax={255}
                        aria-valuenow={rgba.r}
                    >
                        <div class="thumb" style="left: {value[0] * 100}%"></div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <span class="track-label">G</span>
                    <span class="track-value">{Math.round(rgba.g)}</span>
                </div>
                <div class="relative h-3 rounded-sm overflow-hidden">
                    <div
                        bind:this={gTrack}
                        class="absolute inset-0 cursor-pointer touch-none rounded-sm"
                        style="background: linear-gradient(to right,  black, green)"
                        on:pointerdown={gDown}
                        on:pointermove={gMove}
                        on:lostpointercapture={fireCommit}
                        role="slider"
                        tabindex={0}
                        aria-label="Green"
                        aria-valuemin={0}
                        aria-valuemax={255}
                        aria-valuenow={rgba.g}
                    >
                        <div class="thumb" style="left: {value[1] * 100}%"></div>
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-1">
                <div class="flex items-center justify-between">
                    <span class="track-label">B</span>
                    <span class="track-value">{Math.round(rgba.b)}</span>
                </div>
                <div class="relative h-3 rounded-sm overflow-hidden">
                    <div
                        bind:this={bTrack}
                        class="absolute inset-0 cursor-pointer touch-none rounded-sm"
                        style="background: linear-gradient(to right,  black, blue)"
                        on:pointerdown={bDown}
                        on:pointermove={bMove}
                        on:lostpointercapture={fireCommit}
                        role="slider"
                        tabindex={0}
                        aria-label="Blue"
                        aria-valuemin={0}
                        aria-valuemax={255}
                        aria-valuenow={rgba.b}
                    >
                        <div class="thumb" style="left: {value[2] * 100}%"></div>
                    </div>
                </div>
            </div>

        {:else}
            <div class="flex flex-col gap-1">
                <span class="track-label">Hex</span>
                <input
                    type="text"
                    class="hex-input"
                    bind:value={hexInput}
                    on:focus={() => { hexFocused = true; }}
                    on:blur={commitHex}
                    on:keydown={hexKeydown}
                />
            </div>
        {/if}
    </div>
</div>

<style>
    .sv-white {
        background: linear-gradient(to right, #fff, transparent);
    }

    .sv-black {
        background: linear-gradient(to bottom, transparent, #000);
    }

    .hue-gradient {
        background: linear-gradient(
            to right,
            hsl(0, 100%, 50%),
            hsl(60, 100%, 50%),
            hsl(120, 100%, 50%),
            hsl(180, 100%, 50%),
            hsl(240, 100%, 50%),
            hsl(300, 100%, 50%),
            hsl(360, 100%, 50%)
        );
    }

    .thumb {
        position: absolute;
        top: 1px;
        bottom: 1px;
        width: 6px;
        border-radius: 2px;
        background: white;
        pointer-events: none;
        transform: translateX(-50%);
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 1px 3px rgba(0, 0, 0, 0.4);
    }

    .track-label {
        font-size: 0.6875rem;
        font-weight: 500;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-neutral-400);
    }

    .track-value {
        font-size: 0.6875rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--color-secondary-500);
    }

    .hex-input {
        width: 100%;
        font-size: 0.6875rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: var(--color-neutral-200);
        background: var(--color-neutral-800);
        border: 1px solid transparent;
        border-radius: 0.375rem;
        padding: 0.375rem 0.5rem;
        outline: none;
        transition: border-color 150ms;
    }

    .hex-input:focus {
        border-color: color-mix(in srgb, var(--color-secondary-500) 40%, transparent);
    }
</style>
