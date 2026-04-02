<script lang="ts">
    import IconButton from "../Shared/IconButton.svelte";
    import GroupIcon from "../../icons/GroupIcon.svelte";
    import { createGroupMaterial, createSolidColorMaterial, getMaterialInsertionPoint } from "../../lib/logic/materials/materials";
    import { cn } from "../../lib/core/utils";
    import MaterialTreeDisplay from "./MaterialTree/MaterialTreeDisplay.svelte";
    import { eventStore } from "../../lib/events/event-store";
    import { materialUI } from "../../lib/stores/user-interface";
    import { get } from "svelte/store";
    import SolidColorIcon from "../../icons/SolidColorIcon.svelte";

    export let className: string | undefined = undefined;

    function handleCreateSolidColorMaterial() {
        const { parentId, positionInChildren } = getMaterialInsertionPoint(get(materialUI).selectedMaterials);
        const material = createSolidColorMaterial({ parentId }, positionInChildren);
        eventStore.push({
            category: "Material",
            type: "Created",
            forwardData: { material: structuredClone(material) },
            backwardData: { materialId: material.id },
        });
    }

    function handleCreateGroupMaterial() {
        const { parentId, positionInChildren } = getMaterialInsertionPoint(get(materialUI).selectedMaterials);
        const material = createGroupMaterial({ parentId }, positionInChildren);
        eventStore.push({
            category: "Material",
            type: "Created",
            forwardData: { material: structuredClone(material) },
            backwardData: { materialId: material.id },
        });
    }
</script>

<div class={cn(
    "w-full h-full",
    "flex flex-col items-stretch justify-center",
    "gap-2 pt-1.5",
    className
)}>
    <div class="flex flex-row flex-wrap gap-2 items-center justify-center my-3">
        <IconButton variant="primary" onClick={handleCreateSolidColorMaterial} size="large">
            <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                <SolidColorIcon />
            </span> 
        </IconButton>
        <IconButton variant="primary" onClick={handleCreateGroupMaterial} size="large">
            <span class="inline-flex size-6 shrink-0 [&_svg]:size-full" aria-hidden="true">
                <GroupIcon className="stroke-[1px]" />
            </span>
        </IconButton>
    </div>
    <MaterialTreeDisplay className="flex-1" />
</div>
