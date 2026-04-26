import { createId } from "../../core/utils";
import defaultVertexShader from "../../../shaders/default-material-template.vert?raw";
import defaultFragmentShader from "../../../shaders/default-material-template.frag?raw";
import { addMaterialTemplateToStores, deleteMaterialTemplateStore } from "../../stores/material-templates";

export type MaterialTemplateType = "SurfaceMaterial";

export type MaterialTemplate = {
    id: string;
    name: string;
    type: MaterialTemplateType;
    vertexShader: string;
    vertexShaderEditValue: string;
    vertexShaderErrors: string[] | null;
    fragmentShader: string;
    fragmentShaderEditValue: string;
    fragmentShaderErrors: string[] | null;
    hasErrors: boolean;
    hidden: boolean;
};

export const DEFAULT_VERTEX_SHADER = defaultVertexShader;
export const DEFAULT_FRAGMENT_SHADER = defaultFragmentShader;

export const DEFAULT_MATERIAL_TEMPLATE_ID = "default";

export function createDefaultMaterialTemplate(): MaterialTemplate {
    return {
        id: DEFAULT_MATERIAL_TEMPLATE_ID,
        name: "Default",
        type: "SurfaceMaterial",
        vertexShader: DEFAULT_VERTEX_SHADER,
        vertexShaderEditValue: DEFAULT_VERTEX_SHADER,
        vertexShaderErrors: null,
        fragmentShader: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderEditValue: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderErrors: null,
        hidden: true,
        hasErrors: false,
    };
}

export function createMaterialTemplate(values: Partial<Omit<MaterialTemplate, "type">> = {}): MaterialTemplate {
    const template: MaterialTemplate = {
        id: createId(),
        name: values.name ?? "New Template",
        type: "SurfaceMaterial",
        vertexShader: DEFAULT_VERTEX_SHADER,
        vertexShaderEditValue: DEFAULT_VERTEX_SHADER,
        vertexShaderErrors: null,
        fragmentShader: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderEditValue: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderErrors: null,
        hidden: false,
        hasErrors: false,
        ...values,
    };
    addMaterialTemplateToStores(template.id, template);
    return template;
}

export function restoreMaterialTemplate(template: MaterialTemplate) {
    addMaterialTemplateToStores(template.id, template);
}

export function deleteMaterialTemplate(id: string) {
    deleteMaterialTemplateStore(id);
}