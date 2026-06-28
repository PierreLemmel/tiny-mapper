import { describe, expect, it } from "vitest";
import {
    clampValueForUniform,
    isValueOkForUniform,
} from "../../../lib/logic/material-templates/material-templates";
import type {
    MaterialTemplateBoolUniform,
    MaterialTemplateColorUniform,
    MaterialTemplateEnumUniform,
    MaterialTemplateFloatUniform,
    MaterialTemplatePoint2DUniform,
    MaterialTemplateTimedUniform,
} from "../../../lib/logic/material-templates/uniforms";

const slider: MaterialTemplateFloatUniform = {
    key: "intensity",
    label: "Intensity",
    type: "slider",
    min: 0,
    max: 1,
    default: 0.5,
};

const timed: MaterialTemplateTimedUniform = {
    key: "time",
    label: "Time",
    type: "timed",
    timeScale: 1,
    min: 0,
    max: 4,
};

const timedDefaults: MaterialTemplateTimedUniform = {
    key: "clock",
    type: "timed",
};

const point: MaterialTemplatePoint2DUniform = {
    key: "center",
    label: "Center",
    type: "point2D",
    min: [-1, -1],
    max: [1, 1],
    default: [0, 0],
};

const color: MaterialTemplateColorUniform = {
    key: "tint",
    label: "Tint",
    type: "color",
    default: [1, 1, 1, 1],
};

const bool: MaterialTemplateBoolUniform = {
    key: "enabled",
    label: "Enabled",
    type: "bool",
    default: true,
};

const enumUniform: MaterialTemplateEnumUniform = {
    key: "mode",
    label: "Mode",
    type: "enum",
    options: [
        { id: 0, label: "Normal" },
        { id: 1, label: "Add" },
        { id: 2, label: "Multiply" },
    ],
    default: 0,
};

describe("isValueOkForUniform - slider (type-only)", () => {
    it("accepts any finite number, regardless of min/max", () => {
        expect(isValueOkForUniform(0.5, slider)).toBe(true);
        expect(isValueOkForUniform(-100, slider)).toBe(true);
        expect(isValueOkForUniform(100, slider)).toBe(true);
    });

    it("rejects non-numeric, NaN and infinite values", () => {
        expect(isValueOkForUniform("0.5", slider)).toBe(false);
        expect(isValueOkForUniform(NaN, slider)).toBe(false);
        expect(isValueOkForUniform(Infinity, slider)).toBe(false);
        expect(isValueOkForUniform(-Infinity, slider)).toBe(false);
        expect(isValueOkForUniform(null, slider)).toBe(false);
        expect(isValueOkForUniform(undefined, slider)).toBe(false);
    });
});

describe("isValueOkForUniform - timed (type-only)", () => {
    it("accepts any finite number", () => {
        expect(isValueOkForUniform(0, timed)).toBe(true);
        expect(isValueOkForUniform(123.456, timed)).toBe(true);
        expect(isValueOkForUniform(-999, timed)).toBe(true);
    });

    it("rejects NaN, infinite and non-numeric values", () => {
        expect(isValueOkForUniform(NaN, timed)).toBe(false);
        expect(isValueOkForUniform(Infinity, timed)).toBe(false);
        expect(isValueOkForUniform("1", timed)).toBe(false);
        expect(isValueOkForUniform(null, timed)).toBe(false);
        expect(isValueOkForUniform(undefined, timed)).toBe(false);
    });
});

describe("isValueOkForUniform - point2D (type-only)", () => {
    it("accepts any [number, number] pair, regardless of min/max", () => {
        expect(isValueOkForUniform([0, 0], point)).toBe(true);
        expect(isValueOkForUniform([-10, 10], point)).toBe(true);
        expect(isValueOkForUniform([100, -100], point)).toBe(true);
    });

    it("rejects wrong-length arrays", () => {
        expect(isValueOkForUniform([0], point)).toBe(false);
        expect(isValueOkForUniform([0, 0, 0], point)).toBe(false);
    });

    it("rejects non-array values and non-finite / non-numeric components", () => {
        expect(isValueOkForUniform("0,0", point)).toBe(false);
        expect(isValueOkForUniform({ x: 0, y: 0 }, point)).toBe(false);
        expect(isValueOkForUniform([0, NaN], point)).toBe(false);
        expect(isValueOkForUniform([0, Infinity], point)).toBe(false);
        expect(isValueOkForUniform([0, "0"], point)).toBe(false);
        expect(isValueOkForUniform(null, point)).toBe(false);
    });
});

describe("isValueOkForUniform - color (type-only)", () => {
    it("accepts any 4-component array of finite numbers, regardless of [0, 1] range", () => {
        expect(isValueOkForUniform([0, 0, 0, 0], color)).toBe(true);
        expect(isValueOkForUniform([1, 1, 1, 1], color)).toBe(true);
        expect(isValueOkForUniform([2, -1, 5, 0.5], color)).toBe(true);
    });

    it("rejects 3-component arrays (RawColor must include alpha)", () => {
        expect(isValueOkForUniform([1, 0, 0], color)).toBe(false);
    });

    it("rejects non-numeric / non-finite components", () => {
        expect(isValueOkForUniform([1, 0, 0, NaN], color)).toBe(false);
        expect(isValueOkForUniform([1, 0, 0, Infinity], color)).toBe(false);
        expect(isValueOkForUniform([1, 0, 0, "1"], color)).toBe(false);
    });

    it("rejects non-array values", () => {
        expect(isValueOkForUniform("rgb(255, 0, 0)", color)).toBe(false);
        expect(isValueOkForUniform({ r: 255, g: 0, b: 0, a: 1 }, color)).toBe(false);
        expect(isValueOkForUniform(null, color)).toBe(false);
    });
});

describe("isValueOkForUniform - bool", () => {
    it("accepts true and false", () => {
        expect(isValueOkForUniform(true, bool)).toBe(true);
        expect(isValueOkForUniform(false, bool)).toBe(true);
    });

    it("rejects 0/1 and truthy non-booleans (preview values must be canonical)", () => {
        expect(isValueOkForUniform(0, bool)).toBe(false);
        expect(isValueOkForUniform(1, bool)).toBe(false);
        expect(isValueOkForUniform("true", bool)).toBe(false);
        expect(isValueOkForUniform(null, bool)).toBe(false);
        expect(isValueOkForUniform(undefined, bool)).toBe(false);
    });
});

describe("isValueOkForUniform - enum", () => {
    it("accepts an integer that matches one of the option ids", () => {
        expect(isValueOkForUniform(0, enumUniform)).toBe(true);
        expect(isValueOkForUniform(1, enumUniform)).toBe(true);
        expect(isValueOkForUniform(2, enumUniform)).toBe(true);
    });

    it("rejects integers that do not match any option id", () => {
        expect(isValueOkForUniform(3, enumUniform)).toBe(false);
        expect(isValueOkForUniform(-1, enumUniform)).toBe(false);
    });

    it("rejects non-integer and non-numeric values", () => {
        expect(isValueOkForUniform(1.5, enumUniform)).toBe(false);
        expect(isValueOkForUniform("1", enumUniform)).toBe(false);
        expect(isValueOkForUniform(null, enumUniform)).toBe(false);
        expect(isValueOkForUniform(undefined, enumUniform)).toBe(false);
    });

    it("rejects every value when options is empty", () => {
        const empty: MaterialTemplateEnumUniform = {
            ...enumUniform,
            options: [],
        };
        expect(isValueOkForUniform(0, empty)).toBe(false);
    });
});

describe("clampValueForUniform - slider", () => {
    it("returns the value untouched when inside [min, max]", () => {
        expect(clampValueForUniform(0, slider)).toBe(0);
        expect(clampValueForUniform(0.5, slider)).toBe(0.5);
        expect(clampValueForUniform(1, slider)).toBe(1);
    });

    it("clamps below min to min and above max to max", () => {
        expect(clampValueForUniform(-5, slider)).toBe(0);
        expect(clampValueForUniform(99, slider)).toBe(1);
    });

    it("respects custom min/max", () => {
        const custom: MaterialTemplateFloatUniform = {
            ...slider,
            min: -10,
            max: 10,
        };
        expect(clampValueForUniform(-25, custom)).toBe(-10);
        expect(clampValueForUniform(25, custom)).toBe(10);
        expect(clampValueForUniform(3, custom)).toBe(3);
    });
});

describe("clampValueForUniform - timed", () => {
    it("returns the value untouched when inside [min, max]", () => {
        expect(clampValueForUniform(0, timed)).toBe(0);
        expect(clampValueForUniform(2, timed)).toBe(2);
        expect(clampValueForUniform(4, timed)).toBe(4);
    });

    it("clamps below min to min and above max to max", () => {
        expect(clampValueForUniform(-9999, timed)).toBe(0);
        expect(clampValueForUniform(1e10, timed)).toBe(4);
    });

    it("uses default min/max when omitted from the uniform", () => {
        expect(clampValueForUniform(-9999, timedDefaults)).toBe(0);
        expect(clampValueForUniform(1e10, timedDefaults)).toBe(4);
        expect(clampValueForUniform(2, timedDefaults)).toBe(2);
    });

    it("respects custom min/max", () => {
        const custom: MaterialTemplateTimedUniform = {
            ...timed,
            min: -1,
            max: 2,
        };
        expect(clampValueForUniform(-5, custom)).toBe(-1);
        expect(clampValueForUniform(5, custom)).toBe(2);
        expect(clampValueForUniform(1, custom)).toBe(1);
    });
});

describe("clampValueForUniform - point2D", () => {
    it("returns the value untouched when both components are in range", () => {
        expect(clampValueForUniform([0, 0], point)).toEqual([0, 0]);
        expect(clampValueForUniform([-1, 1], point)).toEqual([-1, 1]);
    });

    it("clamps each component independently to its [min, max]", () => {
        expect(clampValueForUniform([-5, 5], point)).toEqual([-1, 1]);
        expect(clampValueForUniform([10, -10], point)).toEqual([1, -1]);
        expect(clampValueForUniform([10, 0.25], point)).toEqual([1, 0.25]);
    });

    it("respects asymmetric per-axis ranges", () => {
        const wide: MaterialTemplatePoint2DUniform = {
            ...point,
            min: [-5, 0],
            max: [5, 10],
        };
        expect(clampValueForUniform([-99, 99], wide)).toEqual([-5, 10]);
        expect(clampValueForUniform([2, -2], wide)).toEqual([2, 0]);
    });

    it("returns a new array (does not mutate the input)", () => {
        const input: [number, number] = [10, -10];
        const result = clampValueForUniform(input, point);
        expect(result).not.toBe(input);
        expect(input).toEqual([10, -10]);
    });
});

describe("clampValueForUniform - color", () => {
    it("returns the value untouched (per-component) when in [0, 1]", () => {
        expect(clampValueForUniform([0, 0.5, 1, 0.25], color)).toEqual([
            0, 0.5, 1, 0.25,
        ]);
    });

    it("clamps each component to [0, 1]", () => {
        expect(clampValueForUniform([2, -0.5, 0.5, 5], color)).toEqual([
            1, 0, 0.5, 1,
        ]);
    });

    it("returns a new array (does not mutate the input)", () => {
        const input = [2, -0.5, 0.5, 5];
        const result = clampValueForUniform(input, color);
        expect(result).not.toBe(input);
        expect(input).toEqual([2, -0.5, 0.5, 5]);
    });
});

describe("clampValueForUniform - bool / enum (no range)", () => {
    it("returns booleans untouched", () => {
        expect(clampValueForUniform(true, bool)).toBe(true);
        expect(clampValueForUniform(false, bool)).toBe(false);
    });

    it("returns enum values untouched, even when not part of the options", () => {
        expect(clampValueForUniform(0, enumUniform)).toBe(0);
        expect(clampValueForUniform(2, enumUniform)).toBe(2);
        expect(clampValueForUniform(99, enumUniform)).toBe(99);
    });
});
