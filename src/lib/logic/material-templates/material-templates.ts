import { clamp, clamp01, createId } from "../../core/utils";
import defaultVertexShader from "../../../shaders/default-material-template.vert?raw";
import defaultFragmentShader from "../../../shaders/default-material-template.frag?raw";
import { addMaterialTemplateToStores, deleteMaterialTemplateStore } from "../../stores/material-templates";
import type { MaterialTemplateUniform, MaterialTemplateUniformsValues } from "./uniforms";

export type MaterialTemplateType = "SurfaceMaterial";


export type MaterialTemplate = {
    id: string;
    name: string;
    description: string;
    author: string;
    tags?: string[];
    uniforms: MaterialTemplateUniform[];
    uniformsPreviewValues: MaterialTemplateUniformsValues;
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
        uniformsPreviewValues: {},
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
        uniformsPreviewValues: {},
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

export function isValueOkForUniform(value: any, uniform: MaterialTemplateUniform): boolean {
    switch (uniform.type) {
        case "slider":
        case "timed":
            return typeof value === "number" && Number.isFinite(value);

        case "point2D":
            return (
                Array.isArray(value) &&
                value.length === 2 &&
                value.every(
                    (v) => typeof v === "number" && Number.isFinite(v),
                )
            );

        case "color":
            return (
                Array.isArray(value) &&
                value.length === 4 &&
                value.every(
                    (v) => typeof v === "number" && Number.isFinite(v),
                )
            );

        case "bool":
            return typeof value === "boolean";

        case "enum":
            return (
                Number.isInteger(value) &&
                uniform.options.some((o) => o.id === value)
            );
    }
}

export function clampValueForUniform(value: any, uniform: MaterialTemplateUniform): any {
    switch (uniform.type) {
        case "slider":
            return clamp(value, uniform.min, uniform.max);

        case "point2D":
            return [
                clamp(value[0], uniform.min[0], uniform.max[0]),
                clamp(value[1], uniform.min[1], uniform.max[1]),
            ] as [number, number];

        case "color":
            return [
                clamp01(value[0]),
                clamp01(value[1]),
                clamp01(value[2]),
                clamp01(value[3]),
            ];

        case "timed":
        case "bool":
        case "enum":
            return value;
    }
}