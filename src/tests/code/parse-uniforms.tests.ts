/// <reference types="node" />
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseUniforms } from "../../lib/rendering/compilation";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const VALID_DIR = join(__dirname, "shaders", "valid");
const INVALID_DIR = join(__dirname, "shaders", "invalid");

function loadShader(folder: string, name: string): string {
    return readFileSync(join(folder, name), "utf-8");
}

function listShaders(folder: string): string[] {
    return readdirSync(folder).filter((f) => f.endsWith(".frag"));
}

describe("parseUniforms - all valid fixtures parse without errors", () => {
    for (const fixture of listShaders(VALID_DIR)) {
        it(`parses '${fixture}' successfully`, () => {
            const shader = loadShader(VALID_DIR, fixture);
            const result = parseUniforms(shader);
            if (!result.success) {
                throw new Error(
                    `Expected success but got errors:\n${result.errors.join("\n")}`,
                );
            }
            expect(result.success).toBe(true);
        });
    }
});

describe("parseUniforms - all invalid fixtures fail with errors", () => {
    for (const fixture of listShaders(INVALID_DIR)) {
        it(`reports errors for '${fixture}'`, () => {
            const shader = loadShader(INVALID_DIR, fixture);
            const result = parseUniforms(shader);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors.length).toBeGreaterThan(0);
            }
        });
    }
});

describe("parseUniforms - slider", () => {
    it("extracts a float slider with all fields", () => {
        const shader = loadShader(VALID_DIR, "slider.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0]).toEqual({
            key: "intensity",
            label: "Intensity",
            description: undefined,
            type: "slider",
            min: 0.0,
            max: 1.0,
            default: 0.5,
        });
    });

    it("rejects slider on a non-float uniform", () => {
        const shader = loadShader(INVALID_DIR, "slider-on-vec2.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /requires GLSL type 'float'/.test(e))).toBe(true);
    });

    it("rejects a default value outside [min, max]", () => {
        const shader = loadShader(INVALID_DIR, "out-of-range.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /out of range/.test(e))).toBe(true);
    });

    it("rejects missing default", () => {
        const shader = loadShader(INVALID_DIR, "missing-default.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /'default'/.test(e))).toBe(true);
    });
});

describe("parseUniforms - timed", () => {
    it("extracts a timed float uniform with timeScale and default", () => {
        const shader = loadShader(VALID_DIR, "timed.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0]).toEqual({
            key: "time",
            label: "Time",
            description: undefined,
            type: "timed",
            timeScale: 1.0,
            default: 0.0,
        });
    });

    it("allows omitting the default value for timed uniforms", () => {
        const shader = loadShader(VALID_DIR, "timed-no-default.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        const uniform = result.uniforms[0];
        expect(uniform.type).toBe("timed");
        if (uniform.type !== "timed") return;
        expect(uniform.timeScale).toBe(0.5);
        expect(uniform.default).toBeUndefined();
        expect(uniform.label).toBe("Clock");
    });

    it("rejects timed on a non-float uniform", () => {
        const shader = loadShader(INVALID_DIR, "timed-on-vec2.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(
            result.errors.some((e) => /type 'timed' requires GLSL type 'float'/.test(e)),
        ).toBe(true);
    });

    it("rejects missing timeScale", () => {
        const shader = loadShader(INVALID_DIR, "timed-missing-timescale.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(
            result.errors.some((e) => /'timeScale' must be a finite number/.test(e)),
        ).toBe(true);
    });

    it("rejects a non-numeric default for timed", () => {
        const shader = loadShader(INVALID_DIR, "timed-bad-default.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(
            result.errors.some((e) => /'default' must be a finite number for timed/.test(e)),
        ).toBe(true);
    });
});

describe("parseUniforms - point2D", () => {
    it("extracts a vec2 point2D with min/max/default", () => {
        const shader = loadShader(VALID_DIR, "point2D.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0]).toEqual({
            key: "center",
            label: "Center",
            description: undefined,
            type: "point2D",
            min: [-1.0, -1.0],
            max: [1.0, 1.0],
            default: [0.0, 0.0],
        });
    });

    it("rejects point2D on a non-vec2 uniform", () => {
        const shader = loadShader(INVALID_DIR, "point2D-on-float.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /requires GLSL type 'vec2'/.test(e))).toBe(true);
    });

    it("rejects min with wrong type", () => {
        const shader = loadShader(INVALID_DIR, "min-wrong-type.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /'min' must be a \[number, number\] pair/.test(e))).toBe(true);
    });
});

describe("parseUniforms - color", () => {
    it("extracts a vec4 color with array default", () => {
        const shader = loadShader(VALID_DIR, "color-vec4.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0]).toEqual({
            key: "tint",
            label: "Tint",
            description: undefined,
            type: "color",
            default: [1.0, 0.5, 0.25, 1.0],
        });
    });

    it("accepts vec3 for color uniforms", () => {
        const shader = loadShader(VALID_DIR, "color-vec3.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0].type).toBe("color");
        if (result.uniforms[0].type !== "color") return;
        expect(result.uniforms[0].default).toEqual([0.8, 0.2, 0.6, 1]);
    });

    it("accepts a string color default like 'rgb(255, 0, 255)'", () => {
        const shader = loadShader(VALID_DIR, "color-string-default.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0].type).toBe("color");
        if (result.uniforms[0].type !== "color") return;
        expect(result.uniforms[0].default).toEqual([1, 0, 1, 1]);
    });

    it("rejects color on a non-vec3/vec4 uniform", () => {
        const shader = loadShader(INVALID_DIR, "color-on-float.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /requires GLSL type 'vec3' or 'vec4'/.test(e))).toBe(true);
    });
});

describe("parseUniforms - bool", () => {
    it("extracts bool uniforms accepting both true/false and 0/1", () => {
        const shader = loadShader(VALID_DIR, "bool.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(2);

        const enabled = result.uniforms[0];
        expect(enabled).toEqual({
            key: "enabled",
            label: "Enabled",
            description: undefined,
            type: "bool",
            default: true,
        });

        const reverse = result.uniforms[1];
        expect(reverse).toEqual({
            key: "reverse",
            label: "Reverse",
            description: undefined,
            type: "bool",
            default: false,
        });
    });

    it("rejects an invalid numeric default for bool", () => {
        const shader = loadShader(INVALID_DIR, "bool-bad-default.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /true\/false or 0\/1/.test(e))).toBe(true);
    });
});

describe("parseUniforms - enum", () => {
    it("extracts enum with options and integer default", () => {
        const shader = loadShader(VALID_DIR, "enum.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0]).toEqual({
            key: "blendMode",
            label: "Blend Mode",
            description: undefined,
            type: "enum",
            options: [
                { id: 0, label: "Normal" },
                { id: 1, label: "Add" },
                { id: 2, label: "Multiply" },
            ],
            default: 1,
        });
    });

    it("rejects non-integer option ids", () => {
        const shader = loadShader(INVALID_DIR, "enum-bad-id.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /\.id must be an integer/.test(e))).toBe(true);
    });

    it("rejects non-string option labels", () => {
        const shader = loadShader(INVALID_DIR, "enum-bad-label.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /\.label must be a string/.test(e))).toBe(true);
    });
});

describe("parseUniforms - labels and descriptions", () => {
    it("uses capitalized key as default label when label is omitted", () => {
        const shader = loadShader(VALID_DIR, "default-label.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms[0].label).toBe("Opacity");
        expect(result.uniforms[0].description).toBeUndefined();
    });

    it("preserves description when provided", () => {
        const shader = loadShader(VALID_DIR, "with-description.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms[0].description).toBe(
            "Surface roughness factor",
        );
    });
});

describe("parseUniforms - multi-uniform shaders", () => {
    it("extracts every annotated uniform in order", () => {
        const shader = loadShader(VALID_DIR, "multi.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms.map((u) => u.key)).toEqual([
            "intensity",
            "center",
            "color",
        ]);
    });

    it("silently skips uniforms that have no preceding metadata", () => {
        const shader = loadShader(VALID_DIR, "no-meta-uniforms-skipped.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.uniforms).toHaveLength(1);
        expect(result.uniforms[0].key).toBe("strength");
    });
});

describe("parseUniforms - error accumulation", () => {
    it("collects all errors at once instead of stopping at the first", () => {
        const shader = loadShader(INVALID_DIR, "multiple-errors.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.length).toBeGreaterThanOrEqual(3);

        expect(result.errors.some((e) => /'alpha'/.test(e))).toBe(true);
        expect(result.errors.some((e) => /'beta'/.test(e))).toBe(true);
        expect(result.errors.some((e) => /'gamma'/.test(e))).toBe(true);
    });

    it("reports a parse error for malformed JSON", () => {
        const shader = loadShader(INVALID_DIR, "bad-json.frag");
        const result = parseUniforms(shader);
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.errors.some((e) => /failed to parse metadata/.test(e))).toBe(true);
    });
});
