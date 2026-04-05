import { get } from "svelte/store";
import { surfaceStore } from "../../stores/surfaces";
import type { Delta } from "../mapping";
import { topLevelSelectedSurfaces } from "./surface-selection";

function translateSurface(surfaceId: string, delta: Delta) {
    surfaceStore(surfaceId).update(s => {
        return {
            ...s,
            transform: {
                ...s.transform,
                position: [s.transform.position[0] + delta[0], s.transform.position[1] + delta[1]]
            }
        };
    });
}

export function translateSelectedSurfaces(delta: Delta) {
    for (const surface of get(topLevelSelectedSurfaces)) {
        translateSurface(surface, delta);
    }
}