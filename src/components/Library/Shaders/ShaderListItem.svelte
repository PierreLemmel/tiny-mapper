<script lang="ts">
    import { cn } from "../../../lib/core/utils";
    import { eventStore } from "../../../lib/events/event-store";
    import { materialTemplateStore } from "../../../lib/stores/material-templates";
    import { libraryUI } from "../../../lib/stores/user-interface";
    import NameDisplay from "../../Shared/NameDisplay.svelte";
    import ShaderThumbnail from "../../Shared/ShaderThumbnail.svelte";

    export let templateId: string;

    export let onSelect: (id: string) => void;
    export let onDelete: (id: string) => void;

    $: active = $libraryUI.shaders.selectedTemplateId === templateId;


    $: template = materialTemplateStore(templateId);
</script>

<div
    class={cn(
        "group flex flex-row items-center gap-2 w-full px-3 py-2.5",
        "transition-colors duration-150 cursor-pointer",
        active ? "bg-primary-400/10" : "hover:bg-neutral-800/50",
    )}
    on:click={() => onSelect(templateId)}
    on:keydown={(e) => e.key === "Enter" && onSelect(templateId)}
    role="button"
    tabindex="0"
>
    <ShaderThumbnail name={$template.name} className="size-10 rounded-md" />
    <div class="flex flex-col gap-0.5 min-w-0 flex-1">
        <NameDisplay
            bind:value={$template.name}
            uppercase={true}
            onCommit={(oldVal, newVal) => {
                eventStore.push({
                    category: "MaterialTemplate",
                    type: "NameChanged",
                    forwardData: { templateId, name: newVal },
                    backwardData: { templateId, name: oldVal },
                });
            }}
        />
        <span class="text-neutral-500 text-[0.6rem] uppercase tracking-wider pl-1.5">
            {$template.type === "SurfaceMaterial" ? "Surface" : $template.type}
        </span>
    </div>
    <button
        type="button"
        class={cn(
            "shrink-0 text-neutral-600 hover:text-red-400 text-[0.6rem] px-1 py-0.5 rounded",
            "transition-colors duration-150 opacity-0 group-hover:opacity-100",
        )}
        on:click|stopPropagation={() => onDelete(templateId)}
        aria-label="Delete shader"
    >
        ✕
    </button>
</div>