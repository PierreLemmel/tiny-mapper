import type { InputContext } from "./input-contexts";

export type ModifierKey = "Ctrl" | "Shift" | "Alt";

export const keyboardKeys = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12",
    "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight",
    "Home", "End", "PageUp", "PageDown",
    "Enter", "Escape", "Tab", "Backspace", "Delete", "Insert",
] as const;

export type KeyboardKey = (typeof keyboardKeys)[number];

export type KeyboardKeyCombination = `${"Ctrl+"|""}${"Shift+"|""}${"Alt+"|""}${KeyboardKey}`;

function isEditableKeyboardTarget(event: KeyboardEvent): boolean {
    const t = event.target;
    if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement) {
        return true;
    }
    if (t instanceof HTMLElement && t.isContentEditable) {
        return true;
    }
    return false;
}

function normalizeKey(event: KeyboardEvent): string {
    const k = event.key;
    if (k.length === 1) {
        return k.toUpperCase();
    }
    return k;
}

function buildKeyCombination(event: KeyboardEvent): string {
    const ctrl = event.ctrlKey || event.metaKey;
    const shift = event.shiftKey;
    const alt = event.altKey;
    const key = normalizeKey(event);
    return `${ctrl ? "Ctrl+" : ""}${shift ? "Shift+" : ""}${alt ? "Alt+" : ""}${key}`;
}

type HandlerMapItem = {
    keyDownHandler: (event: KeyboardEvent) => void;
    keyUpHandler?: (event: KeyboardEvent) => void;
}

export class InputManager {

    private _context: InputContext = "Global";
    public get context(): InputContext {
        return this._context;
    }

    public switchToContext(context: InputContext) {
        this._context = context;
    }

    public restoreGlobalContext() {
        this._context = "Global";
    }

    private keyboardHandlers = new Map<InputContext, Map<string, HandlerMapItem>>();

    public registerKeyboardHandler(context: InputContext, key: KeyboardKeyCombination, keyDownHandler: (event: KeyboardEvent) => void, keyUpHandler?: (event: KeyboardEvent) => void) {
        if (!this.keyboardHandlers.has(context)) {
            this.keyboardHandlers.set(context, new Map());
        }

        const ctxMap = this.keyboardHandlers.get(context)!;
        
        if (ctxMap.has(key)) {
            console.error(`Handler for key ${key} already registered in context ${context}`);
            return () => {};
        }

        ctxMap.set(key, { keyDownHandler, keyUpHandler });

        return () => this.unregisterKeyboardHandler(context, key);
    }

    public unregisterKeyboardHandler(context: InputContext, key: KeyboardKeyCombination) {
        const ctxMap = this.keyboardHandlers.get(context);
        if (ctxMap) {
            ctxMap.delete(key);
        }
    }

    public handleKeyDown(event: KeyboardEvent) {

        if (isEditableKeyboardTarget(event)) return false;

        const keyCombination = buildKeyCombination(event) as KeyboardKeyCombination;

        const ctxHandler = this.keyboardHandlers.get(this._context)?.get(keyCombination);
        const globalHandler = this.keyboardHandlers.get("Global")?.get(keyCombination);

        if (ctxHandler) {
            ctxHandler.keyDownHandler(event);
        }

        if (globalHandler) {
            globalHandler.keyDownHandler(event);
        }
    }

    public handleKeyUp(event: KeyboardEvent) {
        if (isEditableKeyboardTarget(event)) return false;

        const keyCombination = buildKeyCombination(event) as KeyboardKeyCombination;

        const ctxHandler = this.keyboardHandlers.get(this._context)?.get(keyCombination);
        const globalHandler = this.keyboardHandlers.get("Global")?.get(keyCombination);

        if (ctxHandler) {
            ctxHandler.keyUpHandler?.(event);
        }

        if (globalHandler) {
            globalHandler.keyUpHandler?.(event);
        }
    }
}

export const inputManager = new InputManager();
