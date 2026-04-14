<script lang="ts">
    import { get } from "svelte/store";
    import { cn } from "../../../lib/core/utils";
    import {
        materialTemplates,
        addMaterialTemplateToStores,
        deleteMaterialTemplateStore,
        materialTemplateStore,
    } from "../../../lib/stores/material-templates";
    import { createMaterialTemplate, type MaterialTemplate } from "../../../lib/logic/material-templates/material-templates";
    import { eventStore } from "../../../lib/events/event-store";
    import type { MaterialTemplateCreated, MaterialTemplateDeleted } from "../../../lib/events/material-templates/material-templates-event-types";
    import IconButton from "../../Shared/IconButton.svelte";
    import PlusIcon from "../../../icons/PlusIcon.svelte";
    import CodeEditor from "../../Shared/CodeEditor.svelte";
    import ShaderThumbnail from "../../Shared/ShaderThumbnail.svelte";
    import ValidationPopup from "../../Shared/ValidationPopup.svelte";
    import NameDisplay from "../../Shared/NameDisplay.svelte";
    import { libraryUI } from "../../../lib/stores/user-interface";
    import SplitPanels from "../../Shared/SplitPanels.svelte";
    import ShaderPreview from "./ShaderPreview.svelte";
    import ShaderListItem from "./ShaderListItem.svelte";

    export let className: string | undefined = undefined;
    
    let deleteValidationOpen = false;
    let pendingDeleteId: string | null = null;
    let nameCommitStart = "";

    $: pendingDeleteTemplate = pendingDeleteId ? $materialTemplates[pendingDeleteId] : null;
    $: deleteValidationMessage = pendingDeleteTemplate
        ? `This will permanently remove the template "${pendingDeleteTemplate.name}" from the library. Materials that use this template may stop working correctly.`
        : "";

    $: visibleTemplates = Object.values($materialTemplates).filter(t => !t.hidden);
    $: selectedTemplate = $libraryUI.shaders.selectedTemplateId ? $materialTemplates[$libraryUI.shaders.selectedTemplateId] : null;

    $: if ($libraryUI.shaders.selectedTemplateId != null && $materialTemplates[$libraryUI.shaders.selectedTemplateId] === undefined) {
        $libraryUI.shaders.selectedTemplateId = visibleTemplates[0]?.id ?? null;
    }

    function handleCreateTemplate() {
        const template = createMaterialTemplate();
        addMaterialTemplateToStores(template.id, template);
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
        deleteMaterialTemplateStore(id);
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
        $libraryUI.shaders.activeShaderTab = 0;
    }

    function updateTemplate(id: string, changes: Partial<MaterialTemplate>) {
        const store = materialTemplateStore(id);
        if (store) {
            store.update(t => ({ ...t, ...changes }));
        }
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
        {#if selectedTemplate}
            <div class="flex flex-row items-center justify-between px-4 py-2.5 shrink-0 border-b border-neutral-800 gap-4">
                <input
                    type="text"
                    value={selectedTemplate.name}
                    on:focus={() => {
                        nameCommitStart = selectedTemplate.name;
                    }}
                    on:input={(e) => updateTemplate(selectedTemplate.id, { name: e.currentTarget.value })}
                    on:blur={(e) => {
                        const newVal = e.currentTarget.value;
                        if (newVal !== nameCommitStart) {
                            eventStore.push({
                                category: "MaterialTemplate",
                                type: "NameChanged",
                                forwardData: { templateId: selectedTemplate.id, name: newVal },
                                backwardData: { templateId: selectedTemplate.id, name: nameCommitStart },
                            });
                        }
                    }}
                    class={cn(
                        "bg-transparent text-neutral-200 text-xs font-medium uppercase tracking-wider",
                        "border-b border-transparent outline-none min-w-0 flex-1",
                        "focus:border-neutral-600 transition-colors duration-150",
                    )}
                    aria-label="Shader name"
                />
                <div class="flex flex-row items-center gap-1 shrink-0">
                    <button
                        type="button"
                        class={cn(
                            "px-3 py-1 text-[0.625rem] font-medium uppercase tracking-wider rounded-md transition-colors duration-150",
                            $libraryUI.shaders.activeShaderTab === 0
                                ? "bg-neutral-700 text-neutral-100"
                                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800",
                        )}
                        on:click={() => $libraryUI.shaders.activeShaderTab = 0}
                    >
                        Fragment.glsl
                    </button>
                    <button
                        type="button"
                        class={cn(
                            "px-3 py-1 text-[0.625rem] font-medium uppercase tracking-wider rounded-md transition-colors duration-150",
                            $libraryUI.shaders.activeShaderTab === 1
                                ? "bg-neutral-700 text-neutral-100"
                                : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800",
                        )}
                        on:click={() => $libraryUI.shaders.activeShaderTab = 1}
                    >
                        Vertex.glsl
                    </button>
                </div>
            </div>

            <div class="flex-1 overflow-auto p-3 min-h-0 relative">
                {#if $libraryUI.shaders.activeShaderTab === 0}
                    <CodeEditor
                        className="h-full"
                        value={selectedTemplate.fragmentShader}
                        onChange={(v) => updateTemplate(selectedTemplate.id, { fragmentShader: v })}
                        onCommit={(oldVal, newVal) => {
                            eventStore.push({
                                category: "MaterialTemplate",
                                type: "FragmentShaderChanged",
                                forwardData: { templateId: selectedTemplate.id, fragmentShader: newVal },
                                backwardData: { templateId: selectedTemplate.id, fragmentShader: oldVal },
                            });
                        }}
                    />
                {:else}
                    <CodeEditor
                        className="h-full"
                        value={selectedTemplate.vertexShader}
                        onChange={(v) => updateTemplate(selectedTemplate.id, { vertexShader: v })}
                        onCommit={(oldVal, newVal) => {
                            eventStore.push({
                                category: "MaterialTemplate",
                                type: "VertexShaderChanged",
                                forwardData: { templateId: selectedTemplate.id, vertexShader: newVal },
                                backwardData: { templateId: selectedTemplate.id, vertexShader: oldVal },
                            });
                        }}
                    />
                {/if}

                <ShaderPreview className="absolute bottom-6 right-6 z-10" />
            </div>
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
