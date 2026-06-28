<script lang="ts">
    import { onMount } from "svelte";
    import Button from "../../Shared/Button.svelte";
    import PlayIcon from "../../../icons/PlayIcon.svelte";
    import TabPanel from "../../Shared/TabPanel.svelte";
    import CodeEditor from "../../Code/CodeEditor.svelte";
    import ShaderSettingsPanel from "./ShaderSettingsPanel.svelte";
    import { materialTemplateStore } from "../../../lib/stores/material-templates";
    import ErrorDisplay from "../../Code/ErrorDisplay.svelte";
    import SplitPanels from "../../Shared/SplitPanels.svelte";
    import { libraryUI } from "../../../lib/stores/user-interface";
    import { cn } from "../../../lib/core/utils";
    import { compileTemplate } from "../../../lib/rendering/compilation";
    import type { MaterialTemplate } from "../../../lib/logic/material-templates/material-templates";
    import { inputContext } from "../../../lib/ui/actions/inputContext";
    import { InputContexts } from "../../../lib/ui/inputs/input-contexts";
    import { registerShaderEditorHandlers, unregisterShaderEditorHandlers } from "../../../lib/ui/inputs/shaders/shader-editor-handlers";
    import type { KeyBinding } from "@codemirror/view";

    export let templateId: string;
    export let activeShaderTab = 0;

    $: template = materialTemplateStore(templateId);

    let hasBeenCompiled = false;
    let isCompiling = false;
    let compilationError: string | null = null;
    function onTemplateChange(id: string) {
        hasBeenCompiled = false;
        isCompiling = false;
        compilationError = null;
        vertexModified = false;
        fragmentModified = false;
    }
    $: onTemplateChange(templateId);

    const compileKeymap: KeyBinding[] = [
        {
            key: "Ctrl-s",
            run: () => { onCompile(); return true; }
        },
        {
            key: "Ctrl-b",
            run: () => { onCompile(); return true; }
        },
    ];

    function getAllErrors(template: MaterialTemplate, compilationError: string | null) {
        const errors: {
            category: string;
            errors: string[];
        }[] = [];
        if (compilationError) {
            errors.push({
                category: "Compilation",
                errors: [compilationError],
            });
        }
        if (template.vertexShaderErrors) {
            errors.push({
                category: "Vertex Shader",
                errors: template.vertexShaderErrors,
            });
        }
        if (template.fragmentShaderErrors) {
            errors.push({
                category: "Fragment Shader",
                errors: template.fragmentShaderErrors,
            });
        }
        return errors;
    }
    $: errors = getAllErrors($template, compilationError);
    
    async function onCompile() {
        isCompiling = true;

        try {
            const ct = await compileTemplate(template);
            if (!ct.success) {
                if (ct.compilationErrors) {
                    compilationError = ct.compilationErrors[0];
                }
            }
            else {
                compilationError = null;
            }
        }
        catch (error) {
            compilationError = error as string;
        }
        hasBeenCompiled = true;
        isCompiling = false;

        vertexModified = false;
        fragmentModified = false;
    }

    $: fragmentHasError = $template.fragmentShaderErrors !== null;
    $: vertexHasError = $template.vertexShaderErrors !== null;

    let vertexModified = false;
    let fragmentModified = false;

    $: canCompile = vertexModified || fragmentModified;

    onMount(() => {
        registerShaderEditorHandlers(onCompile);
        return () => unregisterShaderEditorHandlers();
    });

    function decorateText(text: string, modified: boolean, hasError: boolean) {
        let result = '';

        if (hasError) {
            result += "❌ ";
        }

        result += text;

        if (modified) {
            result += " *";
        }
        
        return result;
    }

    $: fragmentDecoratedTabText = decorateText("Fragment.glsl", fragmentModified, fragmentHasError);
    $: vertexDecoratedTabText = decorateText("Vertex.glsl", vertexModified, vertexHasError);

</script>

<div class="contents" use:inputContext={InputContexts.ShaderEditor}>
<SplitPanels
    direction="horizontal"
    applySizeTo="second"
    bind:size={$libraryUI.shaders.settingsPanelSize}
    minSize={180} maxSize={300}
    className="w-full h-full flex-1 min-h-0"
>
    <TabPanel
        slot="first"
        tabs={[
            fragmentDecoratedTabText,
            vertexDecoratedTabText,
        ]}
        bind:activeTab={activeShaderTab}
        className="h-full w-full"
    >
        <svelte:fragment slot="actions">
            <Button variant="primary" onClick={onCompile} disabled={!canCompile}>
                <div class="flex flex-row items-center justify-center gap-1.5">
                    {#if isCompiling}
                        <span class="uppercase tracking-wider text-[0.75rem] font-medium">Compiling...</span>
                    {:else}
                        <span class="uppercase tracking-wider text-[0.75rem] font-medium">Compile</span>
                        <PlayIcon className="size-4 shrink-0" />
                    {/if}
                </div>
            </Button>
        </svelte:fragment>

        <SplitPanels
            direction="vertical"
            applySizeTo="second"
            bind:size={$libraryUI.shaders.errorsPanelSize}
            minSize={20} maxSize={300}
            className="w-full h-full"
        >
            <div
                class={cn(
                    "overflow-auto min-h-0",
                    "w-full h-full"
                )}
                slot="first"
            >
                {#if activeShaderTab === 0}
                    <CodeEditor
                        className="h-full w-full rounded-none"
                        bind:value={$template.fragmentShaderEditValue}
                        onValueChange={() => fragmentModified = true}
                        keymaps={compileKeymap}
                    />
                {:else}
                    <CodeEditor
                        className="h-full w-full"
                        bind:value={$template.vertexShaderEditValue}
                        onValueChange={() => vertexModified = true}
                        keymaps={compileKeymap}
                    />
                {/if}
            </div>
            <ErrorDisplay errors={errors} slot="second" className="w-full h-full" successMessage={hasBeenCompiled ? "✅ Compiled successfully" : "No errors"} />
        </SplitPanels>
    </TabPanel>

    <ShaderSettingsPanel
        slot="second"
        className="w-full h-full"
        templateId={templateId}
    />
</SplitPanels>
</div>