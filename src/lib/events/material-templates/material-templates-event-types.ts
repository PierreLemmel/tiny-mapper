import type { AppEvent } from "../event-store";
import type { MaterialTemplate } from "../../logic/material-templates/material-templates";

export type ApplyMaterialTemplatePropertyData<K extends keyof MaterialTemplate> = {
    templateId: string,
} & Pick<MaterialTemplate, K>;

export type MaterialTemplatePropertyEvent<K extends keyof MaterialTemplate> = AppEvent<"MaterialTemplate", `${Capitalize<K>}Changed`,
    ApplyMaterialTemplatePropertyData<K>,
    ApplyMaterialTemplatePropertyData<K>>;

export type MaterialTemplateNameChanged = MaterialTemplatePropertyEvent<"name">;
export type MaterialTemplateTypeChanged = MaterialTemplatePropertyEvent<"type">;
export type MaterialTemplateVertexShaderChanged = MaterialTemplatePropertyEvent<"vertexShader">;
export type MaterialTemplateFragmentShaderChanged = MaterialTemplatePropertyEvent<"fragmentShader">;

export type MaterialTemplateCreated = AppEvent<"MaterialTemplate", "Created", {
    template: MaterialTemplate,
}, {
    templateId: string,
}>;

export type MaterialTemplateDeleted = AppEvent<"MaterialTemplate", "Deleted", {
    templateIds: string[],
}, {
    deletedTemplates: MaterialTemplate[],
}>;
