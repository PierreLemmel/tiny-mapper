import { inputManager } from "../input-manager";
import { InputContexts } from "../input-contexts";

export function registerShaderEditorHandlers(onCompile: () => void) {
    inputManager.registerKeyboardHandler(InputContexts.ShaderEditor, "Ctrl+S", e => {
        e.preventDefault();
        onCompile();
    });

    inputManager.registerKeyboardHandler(InputContexts.ShaderEditor, "Ctrl+B", e => {
        e.preventDefault();
        onCompile();
    });
}

export function unregisterShaderEditorHandlers() {
    inputManager.unregisterKeyboardHandler(InputContexts.ShaderEditor, "Ctrl+S");
}
