export const InputContexts = {
    Global: "Global",
    MainEditView: "MainEditView",
    SurfaceTree: "SurfaceTree",
    MaterialTree: "MaterialTree",
    ShaderEditor: "ShaderEditor",
} as const;

export type InputContext = (typeof InputContexts)[keyof typeof InputContexts];