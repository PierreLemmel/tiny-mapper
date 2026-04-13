import { createId } from "../../core/utils";
import defaultVertexShader from "../../../shaders/default-material-template.vert?raw";
import defaultFragmentShader from "../../../shaders/default-material-template.frag?raw";

export type MaterialTemplateType = "SurfaceMaterial";

export type MaterialTemplate = {
    id: string;
    name: string;
    type: MaterialTemplateType;
    vertexShader: string;
    fragmentShader: string;
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
        fragmentShader: DEFAULT_FRAGMENT_SHADER,
        hidden: true,
    };
}

export function createMaterialTemplate(values: Partial<Omit<MaterialTemplate, "type">> = {}): MaterialTemplate {
    return {
        id: createId(),
        name: values.name ?? "New Template",
        type: "SurfaceMaterial",
        vertexShader: DEFAULT_VERTEX_SHADER,
        fragmentShader: DEFAULT_FRAGMENT_SHADER,
        hidden: false,
        ...values,
    };
}
