import { addNextSurfaceToSelection, addPreviousSurfaceToSelection, clearSelection, selectAllSurfaces, selectNextSurface, selectPreviousSurface } from "../../../logic/surfaces/surface-selection";
import { inputManager, type KeyboardKeyCombination } from "../input-manager";

type MainEditViewHandler = {
    key: KeyboardKeyCombination;
    handler: (e: KeyboardEvent) => void
};



const handlers: MainEditViewHandler[] = [
    {
        key: "Escape",
        handler: e => clearSelection()
    },
    {
        key: "Ctrl+A",
        handler: e => selectAllSurfaces()
    },
    {
        key: "Tab",
        handler: e => {
            e.preventDefault();
            selectNextSurface();
        }
    },
    {
        key: "Shift+Tab",
        handler: e => {
            e.preventDefault();
            selectPreviousSurface();
        }
    }
]

export function registerMainEditViewHandlers() {
    for (const handler of handlers) {
        inputManager.registerKeyboardHandler("MainEditView", handler.key, handler.handler);
    }
}

export function unregisterMainEditViewHandlers() {
    for (const handler of handlers) {
        inputManager.unregisterKeyboardHandler("MainEditView", handler.key);
    }
}