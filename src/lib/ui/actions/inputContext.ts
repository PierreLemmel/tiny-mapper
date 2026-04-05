import type { InputContext } from "../inputs/input-contexts";
import { inputManager } from "../inputs/input-manager";

export function inputContext(node: HTMLElement, context: InputContext) {
    function onFocusIn() {
        inputManager.switchToContext(context);
    }

    function onFocusOut(e: FocusEvent) {
        const next = e.relatedTarget as Node | null;
        if (next && node.contains(next)) {
            return;
        }
        queueMicrotask(() => {
            if (!node.contains(document.activeElement)) {
                inputManager.restoreGlobalContext();
            }
        });
    }

    node.addEventListener("mousedown", onFocusIn);
    node.addEventListener("focusin", onFocusIn);
    node.addEventListener("focusout", onFocusOut);

    return {
        destroy() {
            node.removeEventListener("focusin", onFocusIn);
            node.removeEventListener("focusout", onFocusOut);
        },
    };
}
