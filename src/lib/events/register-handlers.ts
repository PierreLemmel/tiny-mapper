import { registerSurfacesEventHandlers } from "./surfaces/surfaces-event-handlers";
import { registerLibraryEventHandlers } from "./handlers/library-event-handlers";
import { registerMaterialsEventHandlers } from "./materials/materials-event-handlers";
import { registerMaterialTemplatesEventHandlers } from "./material-templates/material-templates-event-handlers";

export function registerAllEventHandlers() {
    registerSurfacesEventHandlers();
    registerLibraryEventHandlers();
    registerMaterialsEventHandlers();
    registerMaterialTemplatesEventHandlers();
}
