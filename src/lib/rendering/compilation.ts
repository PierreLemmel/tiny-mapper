import { get, type Writable } from "svelte/store";
import type {
    MaterialTemplate,
} from "../logic/material-templates/material-templates";
import { compilationScene, mainRenderer } from "../stores/rendering";
import { log } from "../logging/logger";
import { colorRepresentationToRawColor, type RawColor } from "../core/color";
import type { MaterialTemplateUniform } from "../logic/material-templates/uniforms";

export type ParseUniformsResult = {
    success: true;
    uniforms: MaterialTemplateUniform[];
} | {
    success: false;
    errors: string[];
}

export type CompileTemplateResult = {
    success: true;
} | {
    success: false;
    fragmentShaderErrors: string[] | null;
    vertexShaderErrors: string[] | null;
    compilationErrors: string[] | null;
};


export function parseUniforms(shader: string): ParseUniformsResult {
    const items = tokenizeShader(shader);
    const uniforms: MaterialTemplateUniform[] = [];
    const errors: string[] = [];

    let pendingMeta: { text: string; line: number } | null = null;

    for (const item of items) {
        if (item.kind === "meta") {
            pendingMeta = { text: item.text, line: item.line };
            continue;
        }

        if (!pendingMeta) {
            continue;
        }

        const result = buildUniform(
            item.glslType,
            item.name,
            item.line,
            pendingMeta.text,
        );

        if (result.errors.length > 0) {
            errors.push(...result.errors);
        } else if (result.uniform) {
            uniforms.push(result.uniform);
        }

        pendingMeta = null;
    }

    if (errors.length > 0) {
        return { success: false, errors };
    }
    return { success: true, uniforms };
}

type ShaderItem =
    | { kind: "meta"; text: string; line: number }
    | { kind: "uniform"; glslType: string; name: string; line: number };

function tokenizeShader(shader: string): ShaderItem[] {
    const items: ShaderItem[] = [];
    const isIdentStart = (c: string) => /[A-Za-z_]/.test(c);
    const isIdentPart = (c: string) => /[A-Za-z0-9_]/.test(c);
    const isWhitespace = (c: string) => /\s/.test(c);

    let i = 0;
    let line = 1;

    const advance = (target: number) => {
        for (let j = i; j < target; j++) {
            if (shader[j] === "\n") line++;
        }
        i = target;
    };

    const skipWhitespace = () => {
        while (i < shader.length && isWhitespace(shader[i])) {
            if (shader[i] === "\n") line++;
            i++;
        }
    };

    while (i < shader.length) {
        const ch = shader[i];

        if (isWhitespace(ch)) {
            if (ch === "\n") line++;
            i++;
            continue;
        }

        if (shader.startsWith("//", i)) {
            const startLine = line;
            const end = shader.indexOf("\n", i + 2);
            const e = end === -1 ? shader.length : end;
            const content = shader.slice(i + 2, e).trim();
            if (/^\{[\s\S]*\}$/.test(content)) {
                items.push({ kind: "meta", text: content, line: startLine });
            }
            advance(e);
            continue;
        }

        if (shader.startsWith("/*", i)) {
            const startLine = line;
            const end = shader.indexOf("*/", i + 2);
            const e = end === -1 ? shader.length : end + 2;
            const content = shader.slice(i + 2, e === shader.length ? e : e - 2).trim();
            if (/^\{[\s\S]*\}$/.test(content)) {
                items.push({ kind: "meta", text: content, line: startLine });
            }
            advance(e);
            continue;
        }

        if (isIdentStart(ch)) {
            const startLine = line;
            const start = i;
            while (i < shader.length && isIdentPart(shader[i])) i++;
            const word = shader.slice(start, i);

            if (word === "uniform") {
                skipWhitespace();
                const typeStart = i;
                while (i < shader.length && isIdentPart(shader[i])) i++;
                const glslType = shader.slice(typeStart, i);
                skipWhitespace();
                const nameStart = i;
                while (i < shader.length && isIdentPart(shader[i])) i++;
                const name = shader.slice(nameStart, i);

                while (i < shader.length && shader[i] !== ";" && shader[i] !== "\n") i++;
                if (shader[i] === ";") i++;

                if (glslType.length > 0 && name.length > 0) {
                    items.push({
                        kind: "uniform",
                        glslType,
                        name,
                        line: startLine,
                    });
                }
            }
            continue;
        }

        i++;
    }

    return items;
}

function buildUniform(
    glslType: string,
    name: string,
    line: number,
    metaText: string,
): { uniform?: MaterialTemplateUniform; errors: string[] } {
    const errors: string[] = [];
    const prefix = `Uniform '${name}' (line ${line})`;

    let meta: Record<string, unknown>;
    try {
        const parsed = parseMetaJson(metaText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            return {
                errors: [`${prefix}: metadata must be an object`],
            };
        }
        meta = parsed as Record<string, unknown>;
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { errors: [`${prefix}: failed to parse metadata: ${message}`] };
    }

    const type = meta.type;
    if (typeof type !== "string") {
        return { errors: [`${prefix}: metadata 'type' must be a string`] };
    }

    const label =
        typeof meta.label === "string" ? meta.label : capitalize(name);
    const description =
        typeof meta.description === "string" ? meta.description : undefined;
    const base = { key: name, label, description };

    switch (type) {
        case "slider": {
            if (glslType !== "float") {
                errors.push(
                    `${prefix}: type 'slider' requires GLSL type 'float', got '${glslType}'`,
                );
            }
            const def = meta.default;
            const min = meta.min;
            const max = meta.max;
            if (typeof def !== "number" || !Number.isFinite(def)) {
                errors.push(`${prefix}: 'default' must be a number for slider`);
            }
            if (typeof min !== "number" || !Number.isFinite(min)) {
                errors.push(`${prefix}: 'min' must be a number for slider`);
            }
            if (typeof max !== "number" || !Number.isFinite(max)) {
                errors.push(`${prefix}: 'max' must be a number for slider`);
            }
            if (
                typeof def === "number" &&
                typeof min === "number" &&
                typeof max === "number"
            ) {
                if (min > max) {
                    errors.push(
                        `${prefix}: 'min' (${min}) must be <= 'max' (${max})`,
                    );
                }
                if (def < min || def > max) {
                    errors.push(
                        `${prefix}: default ${def} is out of range [${min}, ${max}]`,
                    );
                }
            }
            if (errors.length > 0) return { errors };
            return {
                uniform: {
                    ...base,
                    type: "slider",
                    min: min as number,
                    max: max as number,
                    default: def as number,
                },
                errors: [],
            };
        }

        case "timed": {
            if (glslType !== "float") {
                errors.push(
                    `${prefix}: type 'timed' requires GLSL type 'float', got '${glslType}'`,
                );
            }
            const timeScale = meta.timeScale;
            if (typeof timeScale !== "number" || !Number.isFinite(timeScale)) {
                errors.push(
                    `${prefix}: 'timeScale' must be a finite number for timed`,
                );
            }
            const hasDefault = "default" in meta;
            const def = meta.default;
            if (
                hasDefault &&
                (typeof def !== "number" || !Number.isFinite(def))
            ) {
                errors.push(
                    `${prefix}: 'default' must be a finite number for timed`,
                );
            }
            if (errors.length > 0) return { errors };
            return {
                uniform: {
                    ...base,
                    type: "timed",
                    timeScale: timeScale as number,
                    ...(hasDefault ? { default: def as number } : {}),
                },
                errors: [],
            };
        }

        case "point2D": {
            if (glslType !== "vec2") {
                errors.push(
                    `${prefix}: type 'point2D' requires GLSL type 'vec2', got '${glslType}'`,
                );
            }
            const def = meta.default;
            const min = meta.min;
            const max = meta.max;
            if (!isNumberPair(def)) {
                errors.push(
                    `${prefix}: 'default' must be a [number, number] pair`,
                );
            }
            if (!isNumberPair(min)) {
                errors.push(`${prefix}: 'min' must be a [number, number] pair`);
            }
            if (!isNumberPair(max)) {
                errors.push(`${prefix}: 'max' must be a [number, number] pair`);
            }
            if (
                isNumberPair(def) &&
                isNumberPair(min) &&
                isNumberPair(max)
            ) {
                if (min[0] > max[0] || min[1] > max[1]) {
                    errors.push(
                        `${prefix}: 'min' [${min}] must be <= 'max' [${max}] component-wise`,
                    );
                }
                if (
                    def[0] < min[0] ||
                    def[0] > max[0] ||
                    def[1] < min[1] ||
                    def[1] > max[1]
                ) {
                    errors.push(
                        `${prefix}: default [${def}] is out of range [${min}]..[${max}]`,
                    );
                }
            }
            if (errors.length > 0) return { errors };
            return {
                uniform: {
                    ...base,
                    type: "point2D",
                    min: min as [number, number],
                    max: max as [number, number],
                    default: def as [number, number],
                },
                errors: [],
            };
        }

        case "color": {
            if (glslType !== "vec3" && glslType !== "vec4") {
                errors.push(
                    `${prefix}: type 'color' requires GLSL type 'vec3' or 'vec4', got '${glslType}'`,
                );
            }
            if (!("default" in meta)) {
                errors.push(`${prefix}: 'default' is required for color`);
            }
            let raw: RawColor | undefined;
            if ("default" in meta) {
                try {
                    raw = colorRepresentationToRawColor(meta.default as never);
                } catch (e) {
                    const message = e instanceof Error ? e.message : String(e);
                    errors.push(
                        `${prefix}: invalid color default: ${message}`,
                    );
                }
            }
            if (errors.length > 0 || !raw) return { errors };
            return {
                uniform: { ...base, type: "color", default: raw },
                errors: [],
            };
        }

        case "bool": {
            if (glslType !== "bool") {
                errors.push(
                    `${prefix}: type 'bool' requires GLSL type 'bool', got '${glslType}'`,
                );
            }
            const def = meta.default;
            let boolDefault: boolean | undefined;
            if (typeof def === "boolean") {
                boolDefault = def;
            } else if (def === 0 || def === 1) {
                boolDefault = def === 1;
            } else {
                errors.push(
                    `${prefix}: 'default' must be true/false or 0/1 for bool`,
                );
            }
            if (errors.length > 0 || boolDefault === undefined) return { errors };
            return {
                uniform: { ...base, type: "bool", default: boolDefault },
                errors: [],
            };
        }

        case "enum": {
            if (glslType !== "int") {
                errors.push(
                    `${prefix}: type 'enum' requires GLSL type 'int', got '${glslType}'`,
                );
            }
            const options = meta.options;
            const validatedOptions: { id: number; label: string }[] = [];
            if (!Array.isArray(options) || options.length === 0) {
                errors.push(
                    `${prefix}: 'options' must be a non-empty array for enum`,
                );
            } else {
                for (let i = 0; i < options.length; i++) {
                    const opt = options[i] as Record<string, unknown> | null;
                    if (!opt || typeof opt !== "object") {
                        errors.push(
                            `${prefix}: option[${i}] must be an object`,
                        );
                        continue;
                    }
                    const id = opt.id;
                    const optLabel = opt.label;
                    let optValid = true;
                    if (!Number.isInteger(id)) {
                        errors.push(
                            `${prefix}: option[${i}].id must be an integer`,
                        );
                        optValid = false;
                    }
                    if (typeof optLabel !== "string") {
                        errors.push(
                            `${prefix}: option[${i}].label must be a string`,
                        );
                        optValid = false;
                    }
                    if (optValid) {
                        validatedOptions.push({
                            id: id as number,
                            label: optLabel as string,
                        });
                    }
                }
            }
            const def = meta.default;
            if (!Number.isInteger(def)) {
                errors.push(
                    `${prefix}: 'default' must be an integer for enum`,
                );
            } else if (
                validatedOptions.length > 0 &&
                !validatedOptions.some((o) => o.id === def)
            ) {
                errors.push(
                    `${prefix}: default ${def} does not match any option id`,
                );
            }
            if (errors.length > 0) return { errors };
            return {
                uniform: {
                    ...base,
                    type: "enum",
                    options: validatedOptions,
                    default: def as number,
                },
                errors: [],
            };
        }

        default:
            return {
                errors: [`${prefix}: unknown uniform type '${type}'`],
            };
    }
}

function parseMetaJson(text: string): unknown {
    const normalized = text.replace(
        /([{,])(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g,
        (_match, open: string, ws: string, key: string, colon: string) =>
            `${open}${ws}"${key}"${colon}`,
    );
    return JSON.parse(normalized);
}

function isNumberPair(v: unknown): v is [number, number] {
    return (
        Array.isArray(v) &&
        v.length === 2 &&
        typeof v[0] === "number" &&
        Number.isFinite(v[0]) &&
        typeof v[1] === "number" &&
        Number.isFinite(v[1])
    );
}

function capitalize(s: string): string {
    return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

export async function compileTemplate(store: Writable<MaterialTemplate>): Promise<CompileTemplateResult> {
    const template = get(store);

    const cs = get(compilationScene);
    if (!cs) {
        const errorMsg = "Compilation scene not initialized";
        log.error(errorMsg);
        return {
            success: false,
            fragmentShaderErrors: null,
            vertexShaderErrors: null,
            compilationErrors: [errorMsg],
        }
    }

    const result = await cs.compile(template.vertexShaderEditValue, template.fragmentShaderEditValue);


    const updatedTemplate: MaterialTemplate = structuredClone(template);

    if (result.success) {
        updatedTemplate.hasErrors = false;
        updatedTemplate.vertexShaderErrors = null;
        updatedTemplate.fragmentShaderErrors = null;
        
        updatedTemplate.vertexShader = template.vertexShaderEditValue;
        updatedTemplate.fragmentShader = template.fragmentShaderEditValue;
    }
    else {
        updatedTemplate.hasErrors = true;
        const { fragmentShaderErrors, vertexShaderErrors } = result;

        updatedTemplate.vertexShaderErrors = vertexShaderErrors;
        updatedTemplate.fragmentShaderErrors = fragmentShaderErrors;
    }

    store.set(updatedTemplate);

    return result;
}

export function splitShaderErrors(errors: string | null): string[] | null {
    if (!errors) {
        return null;
    }
    const cleaned = errors.replace(/\0/g, "");
    const result = cleaned.split("\n").filter((error) => error.trim() !== "");
    return result.length > 0 ? result : null;
}