import type { RawColor } from "../../core/color";

type MaterialTemplateUniformBase = {
    key: string;
    label?: string;
    description?: string;
}


export type MaterialTemplateFloatUniform = MaterialTemplateUniformBase & {
    type: "slider";
    min: number;
    max: number;
    default: number;
}

export type MaterialTemplateTimedUniform = MaterialTemplateUniformBase & {
    type: "timed";
    timeScale: number;
    default?: number;
}

export type MaterialTemplatePoint2DUniform = MaterialTemplateUniformBase & {
    type: "point2D";
    min: [number, number];
    max: [number, number];
    default: [number, number];
}

export type MaterialTemplateColorUniform = MaterialTemplateUniformBase & {
    type: "color";
    default: RawColor;
}

export type MaterialTemplateBoolUniform = MaterialTemplateUniformBase & {
    type: "bool";
    default: boolean;
}

export type MaterialTemplateEnumUniform = MaterialTemplateUniformBase & {
    type: "enum";
    options: {
        id: number;
        label: string;
    }[];
    default: number;
}


export type MaterialTemplateUniform = MaterialTemplateFloatUniform
    | MaterialTemplateTimedUniform
    | MaterialTemplatePoint2DUniform
    | MaterialTemplateColorUniform
    | MaterialTemplateBoolUniform
    | MaterialTemplateEnumUniform;

export type MaterialTemplateUniformsValues = {
    [key: string]: any;
}