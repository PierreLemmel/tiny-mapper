import type { ActionReturn } from "svelte/action";

export interface DistinctEvent {
    x: number;
    y: number;
    clientX: number;
    clientY: number;

    pressX: number;
    pressY: number;

    deltaX: number;
    deltaY: number;

    ctrlKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
}

interface CustomAttributes {
    "on:distinctClick"?: (event: CustomEvent<DistinctEvent>) => void;
    "on:distinctDragStart"?: (event: CustomEvent<DistinctEvent>) => void;
    "on:distinctDragMove"?: (event: CustomEvent<DistinctEvent>) => void;
    "on:distinctDragEnd"?: (event: CustomEvent<DistinctEvent>) => void;
}


const DISTANCE_THRESHOLD = 5;
const HOLD_DURATION_THRESHOLD = 500;

export function dragOrClick(node: HTMLElement): ActionReturn<undefined, CustomAttributes> {
    let startX: number;
    let startY: number;
    let isDragging = false;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    function createDistinctEvent(e: MouseEvent): DistinctEvent {

        const x = e.offsetX;
        const y = e.offsetY;

        return {
            x,
            y,
            clientX: e.clientX,
            clientY: e.clientY,
            pressX: startX,
            pressY: startY,
            deltaX: x - startX,
            deltaY: y - startY,
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
        };
    }

    const startDrag = (e: MouseEvent) => {
        isDragging = true;
        node.dispatchEvent(new CustomEvent<DistinctEvent>("distinctDragStart", { detail: createDistinctEvent(e) }));
    };

    const cancelHoldTimer = () => {
        if (holdTimer !== null) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
    };

    const handleMouseDown = (e: MouseEvent) => {

        startX = e.offsetX;
        startY = e.offsetY;
        isDragging = false;
        holdTimer = setTimeout(() => {
            holdTimer = null;
            startDrag(e);
        }, HOLD_DURATION_THRESHOLD);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) {
            const diffX = Math.abs(e.clientX - startX);
            const diffY = Math.abs(e.clientY - startY);
            if (diffX >= DISTANCE_THRESHOLD || diffY >= DISTANCE_THRESHOLD) {
                cancelHoldTimer();
                startDrag(e);
            }
        } else {
            node.dispatchEvent(new CustomEvent<DistinctEvent>("distinctDragMove", { detail: createDistinctEvent(e) }));
        }
    };

    const handleMouseUp = (e: MouseEvent) => {
        cancelHoldTimer();
        if (isDragging) {
            node.dispatchEvent(new CustomEvent<DistinctEvent>("distinctDragEnd", { detail: createDistinctEvent(e) }));
        } else {
            node.dispatchEvent(new CustomEvent<DistinctEvent>("distinctClick", { detail: createDistinctEvent(e) }));
        }
        isDragging = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    node.addEventListener("mousedown", handleMouseDown);

    return {
        destroy() {
            cancelHoldTimer();
            node.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        },
    };
}