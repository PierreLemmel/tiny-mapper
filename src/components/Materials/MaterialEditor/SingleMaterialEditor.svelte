<script lang="ts">
    import GroupIcon from "../../../icons/GroupIcon.svelte";
    import { cn } from "../../../lib/core/utils";
    import type { Material } from "../../../lib/logic/materials/materials";
    import { eventStore } from "../../../lib/events/event-store";
    import NameDisplay from "../../Shared/NameDisplay.svelte";
    import SolidColorIcon from "../../../icons/SolidColorIcon.svelte";
    import HorizontalSeparator from "../../Shared/HorizontalSeparator.svelte";
    import Foldable from "../../Shared/Foldable.svelte";
    import { materialUI } from "../../../lib/stores/user-interface";
    import FoldableColorPicker from "../../Shared/FoldableColorPicker.svelte";
    import { rawColorToCssString } from "../../../lib/core/color";

    export let className: string|undefined = undefined;

    export let material: Material;

    $: iconClasses = cn(
        "size-6",
        "transition-all duration-150",
        "text-primary-400",
    );

    const separatorClasses = "my-0";
</script>

<div class={cn(
    "flex flex-col gap-2 items-stretch w-full py-2 mb-4",
    className
)}>
    <div class={cn(
        "flex flex-row items-end justify-between w-full gap-1.5 mb-3",
    )}>
        {#if material.type === "Group"}
            <GroupIcon className={cn(iconClasses, "p-0.5")} />
        {:else if material.type === "SolidColor"}
            <SolidColorIcon className={cn(iconClasses, "stroke-[1.5px]")} />
        {/if}
        <NameDisplay
            bind:value={material.name}
            className="text-neutral-200"
            onCommit={(oldVal, newVal) => eventStore.push({
                category: "Material", type: "NameChanged",
                forwardData: { materialId: material.id, name: newVal },
                backwardData: { materialId: material.id, name: oldVal },
            })}
        />
        {#if material.type === "SolidColor"}
        <div class="flex flex-row items-center justify-end pr-1">
            <div class="h-4 w-6.5 rounded-xs shrink-0" style="background: {rawColorToCssString(material.color)}"></div>
        </div>
        {/if}
    </div>

    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Base Properties" bind:open={$materialUI.baseProperties.open}>
        <div class="flex flex-col gap-2.5">
            {#if material.type === "SolidColor"}
            <FoldableColorPicker
                title="Color"
                bind:value={material.color}
                bind:open={$materialUI.baseProperties.colorOpen}
                bind:mode={$materialUI.baseProperties.colorColorMode}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Material", type: "ColorChanged",
                    forwardData: { materialId: material.id, color: newVal },
                    backwardData: { materialId: material.id, color: oldVal },
                })}
            />
            {/if}
        </div>
    </Foldable>
</div>