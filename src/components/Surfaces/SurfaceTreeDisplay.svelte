<script lang="ts">
    import { cn } from "../../lib/core/utils";
    import { content } from "../../lib/stores/content";

    export let className: string|undefined = undefined;

    const {
        rootSurfaces,
        surfaces
    } = $content;

    type DisplayItem = {
        name: string;
        indent: number;
        enabled: boolean;
    }

    const displayItems: DisplayItem[] = rootSurfaces
        .map(id => {
            const surface = surfaces[id]
            return {
                name: surface.name,
                indent: 0,
                enabled: surface.enabled
            }
        })
</script>

<div class={cn(
    "bg-purple-500",
    className
)}>
    <!-- {#each $content.rootSurfaces as }
        
    {/each} -->
</div>