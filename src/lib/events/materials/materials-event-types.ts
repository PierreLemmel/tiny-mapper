import type { AppEvent } from "../event-store";
import type { Material } from "../../logic/materials/materials";
import type { MaterialTreeSnapshot } from "../../logic/materials/material-tree-snapshot";

export type ApplyMaterialPropertyData<K extends keyof Material> = {
    materialId: string,
} & Pick<Material, K>;

export type MaterialPropertyEvent<K extends keyof Material> = AppEvent<"Material", `${Capitalize<K>}Changed`,
    ApplyMaterialPropertyData<K>,
    ApplyMaterialPropertyData<K>>;

export type MaterialNameChanged = MaterialPropertyEvent<"name">;
export type MaterialTagsChanged = MaterialPropertyEvent<"tags">;

export type MaterialCreated = AppEvent<"Material", "Created", {
    material: Material,
}, {
    materialId: string,
}>;

export type MaterialDeleted = AppEvent<"Material", "Deleted", {
    materialIds: string[],
}, {
    deletedMaterials: {
        material: Material,
        positionInChildren: number,
    }[],
}>;

export type MaterialTreeMoved = AppEvent<"Material", "TreeMoved",
    MaterialTreeSnapshot,
    MaterialTreeSnapshot
>;
