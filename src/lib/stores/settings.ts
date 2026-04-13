import { writable } from "svelte/store";
import { DbStores } from "../core/db";
import { load, saveOnChange } from "../core/storage";
import type { RawColor } from "../core/color";
import { LogLevel, setLogLevel, type LogLevelValue } from "../logging/logger";

const STORE = DbStores.settings;

const VIDEO_SETTINGS_KEY = "tm-video-settings";
const INPUTS_SETTINGS_KEY = "tm-inputs-settings";
const OUTPUTS_SETTINGS_KEY = "tm-outputs-settings";
const UI_SETTINGS_KEY = "tm-ui-settings";
const APPLICATION_SETTINGS_KEY = "tm-application-settings";

export interface VideoSettings {}

export interface InputsSettings {}

export interface OutputsSettings {}

export interface UISettings {
    selectionColor: RawColor;
    selectionOverlayOpacity: number;
    selectionOutlineThickness: number;

    arrowTranslationSpeed: number;
    vertexSelectionThreshold: number;
    handlesSize: number;
    handlesSelectedColor: RawColor;
    handlesUnselectedColor: RawColor;
    geometryEditorSensitivity: number;
}

export interface ApplicationSettings {
    logLevel: LogLevelValue;
}

const DEFAULT_VIDEO_SETTINGS: VideoSettings = {};
const DEFAULT_INPUTS_SETTINGS: InputsSettings = {};
const DEFAULT_OUTPUTS_SETTINGS: OutputsSettings = {};
const DEFAULT_UI_SETTINGS: UISettings = {
    selectionColor: [0.486, 0.302, 1, 1],
    selectionOverlayOpacity: 0.35,
    selectionOutlineThickness: 4.4,
    arrowTranslationSpeed: 10,
    vertexSelectionThreshold: 10,
    handlesSize: 15,
    handlesSelectedColor: [1, 1, 1, 1],
    handlesUnselectedColor: [0.486, 0.302, 1, 1],
    geometryEditorSensitivity: 1.0,
};

const DEFAULT_APPLICATION_SETTINGS: ApplicationSettings = {
    logLevel: LogLevel.Debug,
};

export const videoSettings = writable<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
export const inputsSettings = writable<InputsSettings>(DEFAULT_INPUTS_SETTINGS);
export const outputsSettings = writable<OutputsSettings>(DEFAULT_OUTPUTS_SETTINGS);
export const uiSettings = writable<UISettings>(DEFAULT_UI_SETTINGS);
export const applicationSettings = writable<ApplicationSettings>(DEFAULT_APPLICATION_SETTINGS);

applicationSettings.subscribe((value) => {
    setLogLevel(value.logLevel);
});

export async function initSettingsStores() {
    videoSettings.set(await load(STORE, VIDEO_SETTINGS_KEY, DEFAULT_VIDEO_SETTINGS));
    inputsSettings.set(await load(STORE, INPUTS_SETTINGS_KEY, DEFAULT_INPUTS_SETTINGS));
    outputsSettings.set(await load(STORE, OUTPUTS_SETTINGS_KEY, DEFAULT_OUTPUTS_SETTINGS));
    uiSettings.set(await load(STORE, UI_SETTINGS_KEY, DEFAULT_UI_SETTINGS));
    applicationSettings.set(await load(STORE, APPLICATION_SETTINGS_KEY, DEFAULT_APPLICATION_SETTINGS));

    saveOnChange(videoSettings, STORE, VIDEO_SETTINGS_KEY);
    saveOnChange(inputsSettings, STORE, INPUTS_SETTINGS_KEY);
    saveOnChange(outputsSettings, STORE, OUTPUTS_SETTINGS_KEY);
    saveOnChange(uiSettings, STORE, UI_SETTINGS_KEY);
    saveOnChange(applicationSettings, STORE, APPLICATION_SETTINGS_KEY);
}
