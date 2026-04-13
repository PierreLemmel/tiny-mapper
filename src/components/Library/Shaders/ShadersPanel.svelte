<script lang="ts">
    import { cn } from "../../../lib/core/utils";
    import { materialTemplates, addMaterialTemplateToStores, deleteMaterialTemplateStore, materialTemplateStore } from "../../../lib/stores/material-templates";
    import { createMaterialTemplate, type MaterialTemplate } from "../../../lib/logic/material-templates/material-templates";
    import IconButton from "../../Shared/IconButton.svelte";
    import TextureIcon from "../../../icons/TextureIcon.svelte";
    import CodeEditor from "../../Shared/CodeEditor.svelte";
    import HorizontalSeparator from "../../Shared/HorizontalSeparator.svelte";

    let expandedTemplateId: string | null = null;

    $: visibleTemplates = Object.values($materialTemplates).filter(t => !t.hidden);

    function handleCreateTemplate() {
        const template = createMaterialTemplate();
        addMaterialTemplateToStores(template.id, template);
        expandedTemplateId = template.id;
    }

    function handleDeleteTemplate(id: string) {
        if (expandedTemplateId === id) {
            expandedTemplateId = null;
        }
        deleteMaterialTemplateStore(id);
    }

    function toggleTemplate(id: string) {
        expandedTemplateId = expandedTemplateId === id ? null : id;
    }

    function updateTemplate(id: string, changes: Partial<MaterialTemplate>) {
        const store = materialTemplateStore(id);
        if (store) {
            store.update(t => ({ ...t, ...changes }));
        }
    }
</script>

<div class="panel flex flex-col h-full p-3 gap-3">
    <div class="flex flex-row items-center justify-between">
        <p class="text-neutral-500 text-xs tracking-widest uppercase">Material Templates</p>
        <IconButton variant="primary" onClick={handleCreateTemplate} size="small">
            <span class="inline-flex size-4 shrink-0 [&_svg]:size-full" aria-hidden="true">
                <TextureIcon />
            </span>
        </IconButton>
    </div>

    {#if visibleTemplates.length === 0}
        <p class="text-neutral-600 text-xs text-center py-4">No templates yet</p>
    {:else}
        <div class="flex flex-col gap-1 overflow-y-auto flex-1">
            {#each visibleTemplates as template (template.id)}
                {@const expanded = expandedTemplateId === template.id}
                <div class={cn(
                    "rounded-md border transition-colors duration-150",
                    expanded ? "border-neutral-600 bg-neutral-900/50" : "border-transparent"
                )}>
                    <div
                        class={cn(
                            "flex items-center justify-between w-full px-3 py-2 rounded-md",
                            "text-left text-sm transition-colors duration-150 cursor-pointer",
                            "hover:bg-neutral-800/60",
                            expanded && "bg-neutral-800/40"
                        )}
                        on:click={() => toggleTemplate(template.id)}
                        on:keydown
                        role="button"
                        tabindex="0"
                    >
                        <div class="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span class="text-neutral-200 truncate text-xs font-medium">{template.name}</span>
                            <span class="text-neutral-500 text-[0.625rem] uppercase tracking-wider">{template.type === "SurfaceMaterial" ? "Surface Material" : template.type}</span>
                        </div>
                        <button
                            class={cn(
                                "text-neutral-500 hover:text-red-400 text-xs px-1.5 py-0.5 rounded",
                                "transition-colors duration-150 hover:bg-neutral-800 shrink-0 ml-2"
                            )}
                            on:click|stopPropagation={() => handleDeleteTemplate(template.id)}
                        >
                            Delete
                        </button>
                    </div>

                    {#if expanded}
                        <div class="px-3 pb-3 flex flex-col gap-3">
                            <HorizontalSeparator />

                            <div class="flex flex-col gap-1.5">
                                <label class="text-neutral-400 text-[0.625rem] uppercase tracking-wider" for="template-name-{template.id}">Name</label>
                                <input
                                    id="template-name-{template.id}"
                                    type="text"
                                    value={template.name}
                                    on:input={(e) => updateTemplate(template.id, { name: e.currentTarget.value })}
                                    class={cn(
                                        "bg-neutral-800 text-neutral-200 text-xs font-medium",
                                        "w-full px-2.5 py-1.5 rounded-md",
                                        "border border-neutral-700 outline-none",
                                        "focus:border-secondary-500/50 transition-colors duration-150"
                                    )}
                                />
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <span class="text-neutral-400 text-[0.625rem] uppercase tracking-wider">Type</span>
                                <span class="text-neutral-300 text-xs bg-neutral-800 px-2.5 py-1.5 rounded-md border border-neutral-700">
                                    {template.type === "SurfaceMaterial" ? "Surface Material" : template.type}
                                </span>
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <span class="text-neutral-400 text-[0.625rem] uppercase tracking-wider">Vertex Shader</span>
                                <CodeEditor
                                    value={template.vertexShader}
                                    onChange={(v) => updateTemplate(template.id, { vertexShader: v })}
                                />
                            </div>

                            <div class="flex flex-col gap-1.5">
                                <span class="text-neutral-400 text-[0.625rem] uppercase tracking-wider">Fragment Shader</span>
                                <CodeEditor
                                    value={template.fragmentShader}
                                    onChange={(v) => updateTemplate(template.id, { fragmentShader: v })}
                                />
                            </div>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
</div>
