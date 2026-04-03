import { writable } from "svelte/store";
import { DbStores } from "../core/db";
import { load, saveOnChange } from "../core/storage";
import type { RawColor } from "../core/color";

const STORE = DbStores.settings;

const VIDEO_SETTINGS_KEY = "tm-video-settings";
const INPUTS_SETTINGS_KEY = "tm-inputs-settings";
const OUTPUTS_SETTINGS_KEY = "tm-outputs-settings";
const UI_SETTINGS_KEY = "tm-ui-settings";

export interface VideoSettings {}

export interface InputsSettings {}

export interface OutputsSettings {}

export interface UISettings {
    selectionColor: RawColor;
}

const DEFAULT_VIDEO_SETTINGS: VideoSettings = {};
const DEFAULT_INPUTS_SETTINGS: InputsSettings = {};
const DEFAULT_OUTPUTS_SETTINGS: OutputsSettings = {};
const DEFAULT_UI_SETTINGS: UISettings = {
    selectionColor: [0.486, 0.302, 1, 1],
};

export const videoSettings = writable<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
export const inputsSettings = writable<InputsSettings>(DEFAULT_INPUTS_SETTINGS);
export const outputsSettings = writable<OutputsSettings>(DEFAULT_OUTPUTS_SETTINGS);
export const uiSettings = writable<UISettings>(DEFAULT_UI_SETTINGS);

export async function initSettingsStores() {
    videoSettings.set(await load(STORE, VIDEO_SETTINGS_KEY, DEFAULT_VIDEO_SETTINGS));
    inputsSettings.set(await load(STORE, INPUTS_SETTINGS_KEY, DEFAULT_INPUTS_SETTINGS));
    outputsSettings.set(await load(STORE, OUTPUTS_SETTINGS_KEY, DEFAULT_OUTPUTS_SETTINGS));
    uiSettings.set(await load(STORE, UI_SETTINGS_KEY, DEFAULT_UI_SETTINGS));

    saveOnChange(videoSettings, STORE, VIDEO_SETTINGS_KEY);
    saveOnChange(inputsSettings, STORE, INPUTS_SETTINGS_KEY);
    saveOnChange(outputsSettings, STORE, OUTPUTS_SETTINGS_KEY);
    saveOnChange(uiSettings, STORE, UI_SETTINGS_KEY);
}
