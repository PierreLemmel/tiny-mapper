const LONG_PRESS_MOVE_THRESHOLD = 5;

export type PointerModifiers = {
    ctrlKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
}

export type LongpressOptions = {
    duration?: number;
    onLongPress: (modifiers: PointerModifiers) => void;
}

export function longpress(node: HTMLElement, options: LongpressOptions) {
    let { duration = 500, onLongPress } = options;
    let timer: ReturnType<typeof setTimeout>;
    let startX: number;
    let startY: number;

    function handlePointerDown(e: PointerEvent) {
        startX = e.clientX;
        startY = e.clientY;
        const modifiers: PointerModifiers = {
            ctrlKey: e.ctrlKey,
            shiftKey: e.shiftKey,
            metaKey: e.metaKey,
        };
        timer = setTimeout(() => onLongPress(modifiers), duration);
    }

    function cancel() {
        clearTimeout(timer);
    }

    function handlePointerMove(e: PointerEvent) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (dx * dx + dy * dy > LONG_PRESS_MOVE_THRESHOLD * LONG_PRESS_MOVE_THRESHOLD) {
            cancel();
        }
    }

    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('pointerup', cancel);
    node.addEventListener('pointerleave', cancel);
    node.addEventListener('pointermove', handlePointerMove);

    return {
        update(newOptions: LongpressOptions) {
            duration = newOptions.duration ?? 500;
            onLongPress = newOptions.onLongPress;
        },
        destroy() {
            cancel();
            node.removeEventListener('pointerdown', handlePointerDown);
            node.removeEventListener('pointerup', cancel);
            node.removeEventListener('pointerleave', cancel);
            node.removeEventListener('pointermove', handlePointerMove);
        }
    };
}
