import { get, type Writable } from "svelte/store";
import { delay } from "../core/utils";
import type { MaterialTemplate } from "../logic/material-templates/material-templates";
import { compilationScene, mainRenderer } from "../stores/rendering";
import { log } from "../logging/logger";

export type CompileTemplateResult = {
    success: true;
} | {
    success: false;
    fragmentShaderErrors: string[] | null;
    vertexShaderErrors: string[] | null;
    compilationErrors: string[] | null;
};

export async function compileTemplate(store: Writable<MaterialTemplate>): Promise<CompileTemplateResult> {
    const template = get(store);

    const cs = get(compilationScene);
    if (!cs) {
        const errorMsg = "Compilation scene not initialized";
        log.error(errorMsg);
        return {
            success: false,
            fragmentShaderErrors: null,
            vertexShaderErrors: null,
            compilationErrors: [errorMsg],
        }
    }

    const result = await cs.compile(template.vertexShaderEditValue, template.fragmentShaderEditValue);


    const updatedTemplate: MaterialTemplate = structuredClone(template);

    if (result.success) {
        updatedTemplate.hasErrors = false;
        updatedTemplate.vertexShaderErrors = null;
        updatedTemplate.fragmentShaderErrors = null;
        
        updatedTemplate.vertexShader = template.vertexShaderEditValue;
        updatedTemplate.fragmentShader = template.fragmentShaderEditValue;
    }
    else {
        updatedTemplate.hasErrors = true;
        const { fragmentShaderErrors, vertexShaderErrors } = result;

        updatedTemplate.vertexShaderErrors = vertexShaderErrors;
        updatedTemplate.fragmentShaderErrors = fragmentShaderErrors;
    }

    store.set(updatedTemplate);

    return result;
}

export function splitShaderErrors(errors: string | null): string[] | null {
    if (!errors) {
        return null;
    }
    const cleaned = errors.replace(/\0/g, "");
    const result = cleaned.split("\n").filter((error) => error.trim() !== "");
    return result.length > 0 ? result : null;
}