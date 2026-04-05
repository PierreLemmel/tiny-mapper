<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import { materialStore } from "../../lib/stores/materials";
    import { materialUI } from "../../lib/stores/user-interface";
    import MultipleMaterialsEditor from "./MaterialEditor/MultipleMaterialsEditor.svelte";
    import NoMaterialEditor from "./MaterialEditor/NoMaterialEditor.svelte";
    import SingleMaterialEditor from "./MaterialEditor/SingleMaterialEditor.svelte";

    export let className: string|undefined = undefined;

    $: material = materialStore($materialUI.selectedMaterials[0]);
</script>

<div class={cn(
    "panel flex items-stretch p-2",
    "overflow-y-auto h-full",
    className
)}>
    {#if $materialUI.selectedMaterials.length === 0}
        <NoMaterialEditor />
    {:else if $materialUI.selectedMaterials.length === 1}
        <SingleMaterialEditor bind:material={$material} />
    {:else if $materialUI.selectedMaterials.length > 1}
        <MultipleMaterialsEditor />
    {/if}
</div>
