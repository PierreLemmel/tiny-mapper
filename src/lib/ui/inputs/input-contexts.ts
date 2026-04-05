export const InputContexts = {
    Global: "Global",
    MainEditView: "MainEditView",
    SurfaceTree: "SurfaceTree",
    MaterialTree: "MaterialTree",
} as const;

export type InputContext = (typeof InputContexts)[keyof typeof InputContexts];