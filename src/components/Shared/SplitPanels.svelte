<script lang="ts">
    import { clamp, cn } from "../../lib/core/utils";

    export let direction: 'horizontal' | 'vertical' = 'horizontal';
    export let applySizeTo: 'first' | 'second' = 'first';
    export let size: number = 300;
    export let minSize: number = 100;
    export let maxSize: number = 100;
    export let className: string | undefined = undefined;

    let containerEl: HTMLElement;
    let dragging = false;

    function onPointerDown(e: PointerEvent) {
        dragging = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        e.preventDefault();

        const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
        const startSize = size;

        function onPointerMove(e: PointerEvent) {
            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
            const delta = (currentPos - startPos) * (applySizeTo === 'first' ? 1 : -1);
            size = clamp(startSize + delta, minSize, maxSize);
        }

        function onPointerUp(e: PointerEvent) {
            dragging = false;
            (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
    }

    let firstContainerStyle: string|undefined = undefined;
    let secondContainerStyle: string|undefined = undefined;

    $: {
        firstContainerStyle = applySizeTo === 'first' ? (direction === 'horizontal' ? `width: ${size}px` : `height: ${size}px`) : undefined
        secondContainerStyle = applySizeTo === 'second' ? (direction === 'horizontal' ? `width: ${size}px` : `height: ${size}px`) : undefined
    }
</script>

<div
    bind:this={containerEl}
    class={cn(
        "flex items-stretch h-full",
        direction === 'horizontal' ? 'flex-row' : 'flex-col',
        className
    )}
>
    <div
        style={firstContainerStyle}
        class={cn(
            "min-w-0 min-h-0",
            applySizeTo === 'first' ? "overflow-hidden shrink-0" : "flex-1"
        )}
    >
        <slot name="first" />
    </div>

    <div
        class={cn(
            "shrink-0 transition-colors duration-150",
            direction === 'horizontal'
                ? 'w-1 cursor-col-resize'
                : 'h-1 cursor-row-resize',
            dragging
                ? 'bg-secondary-500/40'
                : 'bg-neutral-900 hover:bg-secondary-500/20'
        )}
        on:pointerdown={onPointerDown}
        role="separator"
        aria-orientation={direction}
    ></div>

    <div
        style={secondContainerStyle}
        class={cn(
            "min-w-0 min-h-0",
            applySizeTo === 'second' ? "overflow-hidden shrink-0" : "flex-1"
        )}
    >
        <slot name="second" />
    </div>
</div>

