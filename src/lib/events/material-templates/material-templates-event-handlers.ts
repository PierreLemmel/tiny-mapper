import { eventStore } from "../event-store";
import type { MaterialTemplate } from "../../logic/material-templates/material-templates";
import {
    addMaterialTemplateToStores,
    deleteMaterialTemplateStore,
    materialTemplateStore,
} from "../../stores/material-templates";
import type {
    ApplyMaterialTemplatePropertyData,
    MaterialTemplateCreated,
    MaterialTemplateDeleted,
    MaterialTemplatePropertyEvent,
} from "./material-templates-event-types";

function applyMaterialTemplateProperty<K extends keyof MaterialTemplate>(data: ApplyMaterialTemplatePropertyData<K>) {
    const { templateId, ...property } = data;

    materialTemplateStore(data.templateId).update(t => {
        return { ...t, ...property };
    });
}

function registerMaterialTemplatePropertyHandler<K extends keyof MaterialTemplate>(
    property: K,
    forward: (data: ApplyMaterialTemplatePropertyData<K>) => void,
    backward: (data: ApplyMaterialTemplatePropertyData<K>) => void
) {
    eventStore.registerHandler<MaterialTemplatePropertyEvent<K>>(
        "MaterialTemplate",
        `${property.charAt(0).toUpperCase() + property.slice(1)}Changed` as `${Capitalize<K>}Changed`,
        forward,
        backward
    );
}

export function registerMaterialTemplatesEventHandlers() {
    registerMaterialTemplatePropertyHandler(
        "name",
        (data) => applyMaterialTemplateProperty(data),
        (data) => applyMaterialTemplateProperty(data)
    );

    registerMaterialTemplatePropertyHandler(
        "type",
        (data) => applyMaterialTemplateProperty(data),
        (data) => applyMaterialTemplateProperty(data)
    );

    registerMaterialTemplatePropertyHandler(
        "vertexShader",
        (data) => applyMaterialTemplateProperty(data),
        (data) => applyMaterialTemplateProperty(data)
    );

    registerMaterialTemplatePropertyHandler(
        "fragmentShader",
        (data) => applyMaterialTemplateProperty(data),
        (data) => applyMaterialTemplateProperty(data)
    );

    eventStore.registerHandler<MaterialTemplateCreated>(
        "MaterialTemplate",
        "Created",
        (data) => addMaterialTemplateToStores(data.template.id, data.template),
        (data) => {
            deleteMaterialTemplateStore(data.templateId);
        }
    );

    eventStore.registerHandler<MaterialTemplateDeleted>(
        "MaterialTemplate",
        "Deleted",
        (data) => {
            for (const id of data.templateIds) {
                deleteMaterialTemplateStore(id);
            }
        },
        (data) => {
            for (const template of data.deletedTemplates.slice().reverse()) {
                addMaterialTemplateToStores(template.id, template);
            }
        }
    );
}
