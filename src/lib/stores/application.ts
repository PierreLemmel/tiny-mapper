import { writable } from "svelte/store";

export type ApplicationState = {
    loaded: boolean;
};

export const application = writable<ApplicationState>({
    loaded: false,
});