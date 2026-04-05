import { get } from "svelte/store";
import { deleteSelectedSurfaces, selectAllSurfaces, selectNextSurface, selectPreviousSurface } from "../../../logic/surfaces/surface-selection";
import { clearSelection } from "../../../logic/surfaces/surface-selection";
import { inputManager, type KeyboardKeyCombination } from "../input-manager";
import { surfaceUI } from "../../../stores/user-interface";
import { renameRequestId } from "../../../../components/Surfaces/SurfaceTree/surface-tree";

type SurfaceTreeHandler = {
    key: KeyboardKeyCombination;
    handler: (e: KeyboardEvent) => void
};

const handlers: SurfaceTreeHandler[] = [
    {
        key: "Escape",
        handler: e => clearSelection()
    },
    {
        key: "F2",
        handler: e => {
            const sel = get(surfaceUI).selectedSurfaces;
            if (sel.length === 1) {
                e.preventDefault();
                renameRequestId.set(sel[0]);
            }
        }
    },
    {
        key: "Delete",
        handler: e => {
            e.preventDefault();
            deleteSelectedSurfaces();
        }
    },
    {
        key: "Backspace",
        handler: e => {
            e.preventDefault();
            deleteSelectedSurfaces();
        }
    },
    {
        key: "Ctrl+A",
        handler: e => {
            selectAllSurfaces();
        }
    },
    {
        key: "ArrowUp",
        handler: e => {
            e.preventDefault();
            selectPreviousSurface();
        }
    },
    {
        key: "ArrowDown",
        handler: e => {
            e.preventDefault();
            selectNextSurface();
        }
    },
    {
        key: "Shift+ArrowUp",
        handler: e => {
            e.preventDefault();
            selectPreviousSurface({ ctrlKey: true });
        }
    },
    {
        key: "Shift+ArrowDown",
        handler: e => {
            e.preventDefault();
            selectNextSurface({ ctrlKey: true });
        }
    },
    {
        key: "Ctrl+ArrowUp",
        handler: e => {
            e.preventDefault();
            selectPreviousSurface({ ctrlKey: true });
        }
    },
    {
        key: "Ctrl+ArrowDown",
        handler: e => {
            e.preventDefault();
            selectNextSurface({ ctrlKey: true });
        }
    }
]

export function registerSurfaceTreeHandlers() {
    for (const handler of handlers) {
        inputManager.registerKeyboardHandler("SurfaceTree", handler.key, handler.handler);
    }
}

export function unregisterSurfaceTreeHandlers() {
    for (const handler of handlers) {
        inputManager.unregisterKeyboardHandler("SurfaceTree", handler.key);
    }
}