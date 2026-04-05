<script lang="ts">
    import GroupIcon from "../../../icons/GroupIcon.svelte";
    import QuadIcon from "../../../icons/QuadIcon.svelte";
    import { cn } from "../../../lib/core/utils";
    import type { Surface } from "../../../lib/logic/surfaces/surfaces";
    import { eventStore } from "../../../lib/events/event-store";
    import { surfaceUI } from "../../../lib/stores/user-interface";
    import BlendModeEditor from "../../Shared/BlendModeEditor.svelte";
    import Foldable from "../../Shared/Foldable.svelte";
    import FoldableColorPicker from "../../Shared/FoldableColorPicker.svelte";
    import HorizontalSeparator from "../../Shared/HorizontalSeparator.svelte";
    import NameDisplay from "../../Shared/NameDisplay.svelte";
    import PositionEditor from "../../Shared/PositionEditor.svelte";
    import RotationEditor from "../../Shared/RotationEditor.svelte";
    import Slider from "../../Shared/Slider.svelte";
    import SurfaceFlipEditor from "../../Shared/SurfaceFlipEditor.svelte";
    import VisibleCheckbox from "../../Shared/VisibleCheckbox.svelte";
    import ScaleEditor from "../../Shared/ScaleEditor.svelte";
    import type { Writable } from "svelte/store";

    export let className: string|undefined = undefined;

    export let surface: Writable<Surface>;

    $: iconClasses = cn(
        "size-6",
        "transition-all duration-150",
        $surface.enabled ? "text-primary-400" : "text-neutral-400",
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
        {#if $surface.type === "Group"}
            <GroupIcon className={cn(iconClasses, "p-0.5")} />
        {:else if $surface.type === "Quad"}
            <QuadIcon className={cn(iconClasses, "p-0.5 stroke-2")} />
        {/if}
        <NameDisplay
            bind:value={$surface.name}
            className={cn(
                $surface.enabled ? "text-neutral-200" : "text-neutral-400"
            )}
            onCommit={(oldVal, newVal) => eventStore.push({
                category: "Surface", type: "NameChanged",
                forwardData: { surfaceId: $surface.id, name: newVal },
                backwardData: { surfaceId: $surface.id, name: oldVal },
            })}
        />
        <VisibleCheckbox
            bind:visible={$surface.enabled}
            className="mb-0.5"
            onCommit={(oldVal, newVal) => eventStore.push({
                category: "Surface", type: "EnabledChanged",
                forwardData: { surfaceId: $surface.id, enabled: newVal },
                backwardData: { surfaceId: $surface.id, enabled: oldVal },
            })}
        />
    </div>
    
    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Base Properties" bind:open={$surfaceUI.baseProperties.open}>
        <div class="flex flex-col gap-2.5">
            <Slider
                label="Opacity"
                bind:value={$surface.opacity}
                options={{ type: 'percentage' }}
                color="primary"
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "OpacityChanged",
                    forwardData: { surfaceId: $surface.id, opacity: newVal },
                    backwardData: { surfaceId: $surface.id, opacity: oldVal },
                })}
            />
            <BlendModeEditor
                label="Blend Mode"
                bind:value={$surface.blendMode}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "BlendModeChanged",
                    forwardData: { surfaceId: $surface.id, blendMode: newVal },
                    backwardData: { surfaceId: $surface.id, blendMode: oldVal },
                })}
            />
            <FoldableColorPicker
                title="Color"
                bind:value={$surface.color}
                bind:open={$surfaceUI.baseProperties.colorOpen}
                bind:mode={$surfaceUI.baseProperties.colorColorMode}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "ColorChanged",
                    forwardData: { surfaceId: $surface.id, color: newVal },
                    backwardData: { surfaceId: $surface.id, color: oldVal },
                })}
            />
            <SurfaceFlipEditor
                label="Flip"
                bind:value={$surface.flip}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "FlipChanged",
                    forwardData: { surfaceId: $surface.id, flip: newVal },
                    backwardData: { surfaceId: $surface.id, flip: oldVal },
                })}
            />

            <Slider
                label="Feathering"
                bind:value={$surface.feathering}
                options={{ type: 'percentage' }}
                color="primary"
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "FeatheringChanged",
                    forwardData: { surfaceId: $surface.id, feathering: newVal },
                    backwardData: { surfaceId: $surface.id, feathering: oldVal },
                })}
            />
        </div>
    </Foldable>

    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Transform" bind:open={$surfaceUI.transform.open}>
        <div class="flex flex-col gap-2.5">
            <PositionEditor
                label="Position"
                bind:value={$surface.transform.position}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "PositionChanged",
                    forwardData: { surfaceId: $surface.id, position: newVal },
                    backwardData: { surfaceId: $surface.id, position: oldVal },
                })}
            />
            <RotationEditor
                label="Rotation"
                bind:value={$surface.transform.rotation}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "RotationChanged",
                    forwardData: { surfaceId: $surface.id, rotation: newVal },
                    backwardData: { surfaceId: $surface.id, rotation: oldVal },
                })}
            />

            <ScaleEditor
                label="Scale"
                bind:value={$surface.transform.scale}
                bind:lockScale={$surfaceUI.transform.lockScale}
                onCommit={(oldVal, newVal) => eventStore.push({
                    category: "Surface", type: "ScaleChanged",
                    forwardData: { surfaceId: $surface.id, scale: newVal },
                    backwardData: { surfaceId: $surface.id, scale: oldVal },
                })}
            />
        </div>
    </Foldable>

    {#if $surface.type === "Quad"}
    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Geometry" bind:open={$surfaceUI.geometry.open}>
        <div class="flex flex-col gap-2.5">
            
        </div>
    </Foldable>
    {/if}

    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Effects" bind:open={$surfaceUI.effects.open}>
        <div class="flex flex-col gap-2">
            <div>PROP 1</div>
            <div>PROP 2</div>
        </div>
    </Foldable>

    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Input" bind:open={$surfaceUI.input.open}>
        <div class="flex flex-col gap-2">
            <div>PROP 1</div>
            <div>PROP 2</div>
        </div>
    </Foldable>

    <HorizontalSeparator className={separatorClasses} />
    <Foldable title="Material" bind:open={$surfaceUI.material.open}>
        <div class="flex flex-col gap-2">
            <div>PROP 1</div>
            <div>PROP 2</div>
        </div>
    </Foldable>
</div>