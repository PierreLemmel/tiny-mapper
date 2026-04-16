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
        "group flex flex-row items-center gap-2 w-full pr-3 py-2.5",
        "transition-colors duration-150 cursor-pointer",
        active ? "bg-primary-400/25" : "hover:bg-neutral-800/50",
        active ? "pl-2.5 border-l-3 border-secondary-400/70" : "pl-3"
    )}
    on:click={() => onSelect(templateId)}
    on:keydown={(e) => e.key === "Enter" && onSelect(templateId)}
    role="button"
    tabindex="0"
>
    <ShaderThumbnail name={$template.name} className="size-10 rounded-md" />
    <div class="flex flex-col gap-0.5 min-w-0 flex-1">
        <NameDisplay
            className={active ? "text-neutral-100" : "text-neutral-300"}
            bind:value={$template.name}
            onCommit={(oldVal, newVal) => {
                eventStore.push({
                    category: "MaterialTemplate",
                    type: "NameChanged",
                    forwardData: { templateId, name: newVal },
                    backwardData: { templateId, name: oldVal },
                });
            }}
        />
        <span class={cn(
            "text-[0.6rem] uppercase tracking-wider pl-1.5",
            active ? "text-neutral-300" : "text-neutral-400"
        )}>
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