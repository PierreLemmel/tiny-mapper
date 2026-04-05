import { eventStore } from "../../events/event-store";
import { inputManager, type KeyboardKeyCombination } from "./input-manager";

type GlobalHandler = {
    key: KeyboardKeyCombination;
    handler: (e: KeyboardEvent) => void
};

const handlers: GlobalHandler[] = [
    {
        key: "Ctrl+A",
        handler: (e) => {
            e.preventDefault();
            e.stopPropagation();
        }
    },
    {
        key: "Ctrl+Z",
        handler: e => eventStore.undo()
    },
    {
        key: "Ctrl+Y",
        handler: e => eventStore.redo()
    },
    {
        key: "Ctrl+Shift+Z",
        handler: e => eventStore.redo()
    },
    {
        key: "Ctrl+Shift+Y",
        handler: e => eventStore.redo()
    }
]
export function registerGlobalHandlers() {

    for (const handler of handlers) {
        inputManager.registerKeyboardHandler("Global", handler.key, handler.handler);
    }
}

export function unregisterGlobalHandlers() {
    for (const handler of handlers) {
        inputManager.unregisterKeyboardHandler("Global", handler.key);
    }
}