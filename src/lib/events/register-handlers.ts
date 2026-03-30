import { registerSurfacesEventHandlers } from "./surfaces/surfaces-event-handlers";
import { registerLibraryEventHandlers } from "./handlers/library-event-handlers";
import { registerMaterialsEventHandlers } from "./materials/materials-event-handlers";

export function registerAllEventHandlers() {
    registerSurfacesEventHandlers();
    registerLibraryEventHandlers();
    registerMaterialsEventHandlers();
}
