import { createId } from "../../core/utils";
import defaultVertexShader from "../../../shaders/default-material-template.vert?raw";
import defaultFragmentShader from "../../../shaders/default-material-template.frag?raw";
import { addMaterialTemplateToStores, deleteMaterialTemplateStore } from "../../stores/material-templates";
import type { RawColor } from "../../core/color";
import type { MaterialTemplateUniform, MaterialTemplateUniformsValues } from "./uniforms";

export type MaterialTemplateType = "SurfaceMaterial";


export type MaterialTemplate = {
    id: string;
    name: string;
    description: string;
    author: string;
    tags?: string[];
    uniforms: MaterialTemplateUniform[];
    uniformsValues: MaterialTemplateUniformsValues;
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
        description: "Default material template",
        author: "Default",
        tags: [],
        type: "SurfaceMaterial",
        uniformsValues: {},
        vertexShader: DEFAULT_VERTEX_SHADER,
        vertexShaderEditValue: DEFAULT_VERTEX_SHADER,
        vertexShaderErrors: null,
        fragmentShader: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderEditValue: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderErrors: null,
        hidden: true,
        hasErrors: false,
        uniforms: [],
    };
}

export function createMaterialTemplate(values: Partial<Omit<MaterialTemplate, "type">> = {}): MaterialTemplate {
    const template: MaterialTemplate = {
        id: createId(),
        name: "New Material Template",
        description: "New material template",
        author: "Author",
        tags: [],
        type: "SurfaceMaterial",
        uniformsValues: {},
        vertexShader: DEFAULT_VERTEX_SHADER,
        vertexShaderEditValue: DEFAULT_VERTEX_SHADER,
        vertexShaderErrors: null,
        fragmentShader: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderEditValue: DEFAULT_FRAGMENT_SHADER,
        fragmentShaderErrors: null,
        hidden: false,
        hasErrors: false,
        uniforms: [],
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