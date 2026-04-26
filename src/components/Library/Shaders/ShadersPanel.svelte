<script lang="ts">
    import { get } from "svelte/store";
    import {
        materialTemplates,
        materialTemplateStore,
    } from "../../../lib/stores/material-templates";
    import { createMaterialTemplate, deleteMaterialTemplate } from "../../../lib/logic/material-templates/material-templates";
    import { eventStore } from "../../../lib/events/event-store";
    import type { MaterialTemplateCreated, MaterialTemplateDeleted } from "../../../lib/events/material-templates/material-templates-event-types";
    import IconButton from "../../Shared/IconButton.svelte";
    import PlusIcon from "../../../icons/PlusIcon.svelte";
    import ValidationPopup from "../../Shared/ValidationPopup.svelte";
    import { libraryUI } from "../../../lib/stores/user-interface";
    import SplitPanels from "../../Shared/SplitPanels.svelte";
    import ShaderListItem from "./ShaderListItem.svelte";
    import ShaderEditor from "./ShaderEditor.svelte";

    export let className: string | undefined = undefined;
    
    let deleteValidationOpen = false;
    let pendingDeleteId: string | null = null;

    $: pendingDeleteTemplate = pendingDeleteId ? $materialTemplates[pendingDeleteId] : null;
    $: deleteValidationMessage = pendingDeleteTemplate
        ? `This will permanently remove the template "${pendingDeleteTemplate.name}" from the library. Materials that use this template may stop working correctly.`
        : "";

    $: visibleTemplates = Object.values($materialTemplates).filter(t => !t.hidden);

    $: if ($libraryUI.shaders.selectedTemplateId != null && $materialTemplates[$libraryUI.shaders.selectedTemplateId] === undefined) {
        $libraryUI.shaders.selectedTemplateId = visibleTemplates[0]?.id ?? null;
    }

    function handleCreateTemplate() {
        const template = createMaterialTemplate();
        createMaterialTemplate(template);
        $libraryUI.shaders.selectedTemplateId = template.id;
        $libraryUI.shaders.activeShaderTab = 0;

        eventStore.push<MaterialTemplateCreated>({
            category: "MaterialTemplate",
            type: "Created",
            forwardData: { template: structuredClone(template) },
            backwardData: { templateId: template.id },
        });
    }

    function handleDeleteTemplate(id: string) {
        const template = structuredClone(get(materialTemplateStore(id)));
        if ($libraryUI.shaders.selectedTemplateId === id) {
            const others = visibleTemplates.filter(t => t.id !== id);
            $libraryUI.shaders.selectedTemplateId = others.length > 0 ? others[0].id : null;
        }
        deleteMaterialTemplate(id);
        eventStore.push<MaterialTemplateDeleted>({
            category: "MaterialTemplate",
            type: "Deleted",
            forwardData: { templateIds: [id] },
            backwardData: { deletedTemplates: [template] },
        });
    }

    function requestDeleteTemplate(id: string) {
        pendingDeleteId = id;
        deleteValidationOpen = true;
    }

    function confirmDeleteTemplate() {
        if (pendingDeleteId) {
            handleDeleteTemplate(pendingDeleteId);
        }
        pendingDeleteId = null;
    }

    function cancelDeleteTemplate() {
        pendingDeleteId = null;
    }

    function selectTemplate(id: string) {
        $libraryUI.shaders.selectedTemplateId = id;
    }
</script>

<SplitPanels
    direction="horizontal" applySizeTo="first"
    bind:size={$libraryUI.shaders.leftPanelSize}
    minSize={180} maxSize={500}
    className={className}
>
    <div slot="first" class="overflow-hidden">
        <div class="flex flex-row items-center justify-between px-3 py-3 shrink-0">
            <p class="text-neutral-500 text-[0.625rem] tracking-widest uppercase">Shaders</p>
            <IconButton variant="primary" onClick={handleCreateTemplate} size="small">
                <span class="inline-flex size-4 shrink-0 [&_svg]:size-full" aria-hidden="true">
                    <PlusIcon />
                </span>
            </IconButton>
        </div>

        {#if visibleTemplates.length === 0}
            <p class="text-neutral-600 text-xs text-center py-6 px-3">No shaders yet</p>
        {:else}
            <div class="flex flex-col overflow-y-auto flex-1">
                {#each visibleTemplates as template (template.id)}
                    <ShaderListItem
                        templateId={template.id}
                        onSelect={selectTemplate}
                        onDelete={requestDeleteTemplate}
                    />
                {/each}
            </div>
        {/if}
    </div>

    <div slot="second" class="flex flex-col flex-1 min-w-0 overflow-hidden h-full">
        {#if $libraryUI.shaders.selectedTemplateId}
            <ShaderEditor templateId={$libraryUI.shaders.selectedTemplateId} bind:activeShaderTab={$libraryUI.shaders.activeShaderTab} />
        {:else}
            <div class="flex flex-1 items-center justify-center">
                <p class="text-neutral-600 text-xs text-center">Select a shader to edit</p>
            </div>
        {/if}
    </div>
</SplitPanels>


<ValidationPopup
    bind:open={deleteValidationOpen}
    title="Delete material template?"
    message={deleteValidationMessage}
    confirmLabel="Delete"
    cancelLabel="Cancel"
    onConfirm={confirmDeleteTemplate}
    onCancel={cancelDeleteTemplate}
/>
