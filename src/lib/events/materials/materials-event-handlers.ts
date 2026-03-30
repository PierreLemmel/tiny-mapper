import { eventStore } from "../event-store";
import { addMaterial, deleteMaterialAndChildren, type Material } from "../../logic/materials";
import type { ApplyMaterialPropertyData, MaterialCreated, MaterialDeleted, MaterialPropertyEvent, MaterialTreeMoved } from "./materials-event-types";
import { applyMaterialTreeSnapshot } from "./material-tree-snapshot";
import { materialStore } from "../../stores/materials";
import { materialUI } from "../../stores/user-interface";

function applyMaterialProperty<K extends keyof Material>(data: ApplyMaterialPropertyData<K>) {
    const { materialId, ...property } = data;

    materialStore(data.materialId).update(m => {
        return { ...m, ...property };
    });
}

function registerMaterialPropertyHandler<K extends keyof Material>(
    property: K,
    forward: (data: ApplyMaterialPropertyData<K>) => void,
    backward: (data: ApplyMaterialPropertyData<K>) => void
) {
    eventStore.registerHandler<MaterialPropertyEvent<K>>("Material", `${property.charAt(0).toUpperCase() + property.slice(1)}Changed` as `${Capitalize<K>}Changed`,
        forward,
        backward
    );
}

export function registerMaterialsEventHandlers() {
    registerMaterialPropertyHandler(
        "name",
        (data) => applyMaterialProperty(data),
        (data) => applyMaterialProperty(data)
    );

    eventStore.registerHandler<MaterialCreated>(
        "Material",
        "Created",
        (data) => addMaterial(data.material),
        (data) => {
            deleteMaterialAndChildren(data.materialId);
            materialUI.update(ui => ({
                ...ui,
                selectedMaterials: ui.selectedMaterials.filter(id => id !== data.materialId),
            }));
        }
    );

    eventStore.registerHandler<MaterialDeleted>(
        "Material",
        "Deleted",
        (data) => {
            for (const id of data.materialIds) {
                deleteMaterialAndChildren(id);
            }
        },
        (data) => {
            for (const { material, positionInChildren } of data.deletedMaterials) {
                addMaterial(material, positionInChildren);
            }
        }
    );

    eventStore.registerHandler<MaterialTreeMoved>(
        "Material",
        "TreeMoved",
        (data) => applyMaterialTreeSnapshot(data),
        (data) => applyMaterialTreeSnapshot(data)
    );
}
