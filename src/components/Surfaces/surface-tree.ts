import { derived } from "svelte/store";
import { content, type Content } from "../../lib/stores/content";

export type SurfaceDisplayTreeItem = {
    id: string;
    indent: number;
    collapsed: boolean;
    selected: boolean;
}

export const surfaceDisplayTree = derived<typeof content, SurfaceDisplayTreeItem[]>(content, $content => {
    
    return structuredClone($content.rootSurfaces.map(id => {
        return {
            id,
            indent: 0,
            collapsed: false,
            selected: false
        }
    }))
})