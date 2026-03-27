<script lang="ts">
    import CogwheelIcon from "../../icons/CogwheelIcon.svelte";
    import LayoutBottomIcon from "../../icons/LayoutBottomIcon.svelte";
    import LayoutLeftIcon from "../../icons/LayoutLeftIcon.svelte";
    import LayoutRightIcon from "../../icons/LayoutRightIcon.svelte";
    import { cn } from "../../lib/core/utils";
    import { mappingUI, renderingUI } from "../../lib/stores/user-interface";
    import Toggle from "../Shared/Toggle.svelte";

    export let className: string | undefined = undefined;
</script>

<div class={cn(
    "w-full",
    "shrink-0 grid grid-cols-3 items-center justify-center",
    "px-2 py-1 gap-1 border-b-4 border-neutral-800",
    className
)}>
    <div class="justify-self-start flex flex-row items-center gap-1">

    </div>
    <div class="justify-self-center flex flex-row items-center gap-1">
        <Toggle bind:value={$renderingUI.statsDisplay} label="Stats" type="secondary">
            <CogwheelIcon />
        </Toggle>
    </div>
    <div class="justify-self-end flex flex-row items-center gap-1">
        <Toggle bind:value={$mappingUI.leftPanelOpen} label="Left Panel" type="primary">
            <LayoutLeftIcon filled={$mappingUI.leftPanelOpen} />
        </Toggle>
        <Toggle bind:value={$mappingUI.bottomPanelOpen} label="Bottom Panel" type="primary">
            <LayoutBottomIcon filled={$mappingUI.bottomPanelOpen} />
        </Toggle>
        <Toggle bind:value={$mappingUI.rightPanelOpen} label="Bottom Panel" type="primary">
            <LayoutRightIcon filled={$mappingUI.rightPanelOpen} />
        </Toggle>
    </div>
</div>