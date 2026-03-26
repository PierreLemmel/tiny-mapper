<script lang="ts">
    import { circularClamp, cn, radiansToDegrees } from "../../lib/core/utils";

    export let value: number;
    export let className: string | undefined = undefined;

    let divEl: HTMLDivElement;

    let isEditing = false;

    let initVal = value;
    function onPointerDown(e: PointerEvent) {
        e.preventDefault();
        isEditing = true;
        initVal = value;
        divEl.setPointerCapture(e.pointerId);
        document.addEventListener("pointermove", onDocPointerMove);
        document.addEventListener("pointerup", onDocPointerUp);
        document.addEventListener("pointercancel", onDocPointerCancel);
    }

    function onDocPointerMove(e: PointerEvent) {

        const x0 = divEl.getBoundingClientRect().left + divEl.clientWidth / 2;
        const y0 = divEl.getBoundingClientRect().top + divEl.clientHeight / 2;
        const x = e.clientX - x0;
        const y = -(e.clientY - y0);
        
        const angle = radiansToDegrees(Math.atan2(y, x));
        value = circularClamp(angle, 0, 360);
    }

    function cleanup(e: PointerEvent) {
        isEditing = false;
        divEl.releasePointerCapture(e.pointerId);
        document.removeEventListener("pointermove", onDocPointerMove);
        document.removeEventListener("pointerup", onDocPointerUp);
        document.removeEventListener("pointercancel", onDocPointerCancel);
    }

    function onDocPointerUp(e: PointerEvent) {
        cleanup(e);
    }

    function onDocPointerCancel(e: PointerEvent) {
        value = initVal;
        cleanup(e);
    }

</script>

<div
    bind:this={divEl}
    class={cn(
        "rounded-full bg-neutral-800 relative",
        isEditing ? "cursor-rotate" : "cursor-pointer",
        className
    )}
    style="transform: rotate({-value}deg);"
    on:pointerdown={onPointerDown}
    role="spinbutton"
    tabindex={0}
    aria-label="Rotate"
    aria-valuenow={value}
    aria-valuemin={0}
    aria-valuemax={360}
>
    <div class={cn(
        "absolute rounded-full bg-primary-500 right-0 top-1/2 size-5/16",
        "-translate-x-1/8 -translate-y-1/2"
    )}></div>
</div>