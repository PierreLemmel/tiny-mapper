<script lang="ts">
    import { cn } from "../../lib/core/utils";

    export let tags: string[] = [];
    export let availableTags: string[] = [];
    export let label: string = "Tags";
    export let onChange: (oldTags: string[], newTags: string[]) => void;

    let newTagInput = "";
    let inputFocused = false;

    $: suggestions = (() => {
        const filter = newTagInput.trim().toLowerCase();
        return availableTags
            .filter(t => !tags.includes(t))
            .filter(t => filter.length === 0 || t.toLowerCase().includes(filter));
    })();

    $: showSuggestions = suggestions.length > 0;

    function addTag(tag: string) {
        const trimmed = tag.trim();
        if (trimmed.length === 0) return;
        if (tags.includes(trimmed)) {
            newTagInput = "";
            return;
        }
        const oldTags = [...tags];
        const newTags = [...tags, trimmed];
        newTagInput = "";
        onChange(oldTags, newTags);
    }

    function removeTag(tag: string) {
        const oldTags = [...tags];
        const newTags = tags.filter(t => t !== tag);
        onChange(oldTags, newTags);
    }

    function handleTagKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            addTag(newTagInput);
        }
    }

    function handleFocus() {
        inputFocused = true;
    }

    function handleBlur() {
        inputFocused = false;
    }
</script>

<div class="flex flex-col gap-2 px-0.5">
    {#if tags.length > 0}
    <div class="flex flex-row flex-wrap gap-1.5">
        {#each tags as tag}
        <span class={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-md",
            "bg-neutral-800 text-neutral-300 text-[0.625rem] font-medium uppercase tracking-wider",
            "border border-neutral-700"
        )}>
            {tag}
            <button
                class="inline-flex items-center justify-center size-3 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
                on:click={() => removeTag(tag)}
                aria-label="Remove tag {tag}"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="size-full">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </span>
        {/each}
    </div>
    {/if}
    <div class="flex flex-row gap-1.5 items-center">
        <input
            type="text"
            placeholder="Add tag..."
            bind:value={newTagInput}
            on:keydown={handleTagKeydown}
            on:focus={handleFocus}
            on:blur={handleBlur}
            class={cn(
                "flex-1 min-w-0 px-2.5 py-1 rounded-md",
                "bg-neutral-800 border border-transparent",
                "text-xs text-neutral-200 placeholder:text-neutral-500",
                "focus:outline-none",
                "transition-colors duration-150"
            )}
        />
        <button
            class={cn(
                "inline-flex items-center justify-center size-6 rounded-sm",
                "bg-primary-400 text-neutral-950 cursor-pointer",
                "hover:bg-primary-300 active:bg-primary-400",
                "transition-all duration-150",
                newTagInput.trim().length === 0 && "opacity-40 pointer-events-none"
            )}
            on:click={() => addTag(newTagInput)}
            disabled={newTagInput.trim().length === 0}
            aria-label="Add tag"
        >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="size-3.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
        </button>
    </div>
    {#if showSuggestions}
    <div class="flex flex-row flex-wrap gap-1">
        {#each suggestions as suggestion}
        <button
            class={cn(
                "px-2 py-0.5 rounded-md text-[0.625rem] font-medium uppercase tracking-wider",
                "bg-neutral-900 text-neutral-400 border border-neutral-800",
                "hover:bg-neutral-800 hover:text-neutral-200 transition-colors cursor-pointer"
            )}
            on:mousedown|preventDefault={() => addTag(suggestion)}
        >
            {suggestion}
        </button>
        {/each}
    </div>
    {/if}
</div>
