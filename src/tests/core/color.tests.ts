import { describe, expect, it } from "vitest";
import {
    colorRepresentationToRawColor,
    type RawColor,
} from "../../lib/core/color";

const RED: RawColor = [1, 0, 0, 1];
const MAGENTA: RawColor = [1, 0, 1, 1];
const WHITE: RawColor = [1, 1, 1, 1];

function expectClose(actual: RawColor, expected: RawColor, precision = 5) {
    expect(actual).toHaveLength(4);
    for (let i = 0; i < 4; i++) {
        expect(actual[i]).toBeCloseTo(expected[i], precision);
    }
}

describe("colorRepresentationToRawColor - RawColor arrays", () => {
    it("returns a 4-component RawColor unchanged", () => {
        expect(colorRepresentationToRawColor([0.1, 0.2, 0.3, 0.4])).toEqual([
            0.1, 0.2, 0.3, 0.4,
        ]);
    });

    it("treats a 3-component array as opaque RGB", () => {
        expect(colorRepresentationToRawColor([1, 0, 1])).toEqual([1, 0, 1, 1]);
    });

    it("rejects arrays of unsupported length", () => {
        expect(() => colorRepresentationToRawColor([1, 0] as unknown as RawColor)).toThrow();
        expect(() =>
            colorRepresentationToRawColor([1, 0, 0, 0, 1] as unknown as RawColor),
        ).toThrow();
    });

    it("rejects values outside [0, 1]", () => {
        expect(() => colorRepresentationToRawColor([1.5, 0, 0, 1])).toThrow();
        expect(() => colorRepresentationToRawColor([-0.1, 0, 0, 1])).toThrow();
    });
});

describe("colorRepresentationToRawColor - RGB/RGBA objects", () => {
    it("converts an RGBA object", () => {
        expect(
            colorRepresentationToRawColor({ r: 255, g: 0, b: 255, a: 1 }),
        ).toEqual(MAGENTA);
    });

    it("converts an RGB object with implicit alpha = 1", () => {
        expect(colorRepresentationToRawColor({ r: 255, g: 0, b: 255 })).toEqual(
            MAGENTA,
        );
    });

    it("preserves fractional alpha", () => {
        const raw = colorRepresentationToRawColor({
            r: 255,
            g: 0,
            b: 255,
            a: 0.5,
        });
        expectClose(raw, [1, 0, 1, 0.5]);
    });
});

describe("colorRepresentationToRawColor - HSV/HSVA objects", () => {
    it("converts pure red HSV", () => {
        expect(
            colorRepresentationToRawColor({ h: 0, s: 100, v: 100 }),
        ).toEqual(RED);
    });

    it("converts pure white HSV (s = 0)", () => {
        expect(
            colorRepresentationToRawColor({ h: 0, s: 0, v: 100 }),
        ).toEqual(WHITE);
    });

    it("converts HSVA with explicit alpha", () => {
        const raw = colorRepresentationToRawColor({
            h: 0,
            s: 100,
            v: 100,
            a: 0.25,
        });
        expectClose(raw, [1, 0, 0, 0.25]);
    });
});

describe("colorRepresentationToRawColor - rgb()/rgba() strings", () => {
    it("parses 'rgb(255, 0, 255)'", () => {
        expect(colorRepresentationToRawColor("rgb(255, 0, 255)")).toEqual(
            MAGENTA,
        );
    });

    it("parses 'rgb(255, 0, 255, 1.0)'", () => {
        expect(colorRepresentationToRawColor("rgb(255, 0, 255, 1.0)")).toEqual(
            MAGENTA,
        );
    });

    it("parses 'rgba(255, 0, 0, 0.5)'", () => {
        const raw = colorRepresentationToRawColor("rgba(255, 0, 0, 0.5)");
        expectClose(raw, [1, 0, 0, 0.5]);
    });

    it("is case insensitive on the function name", () => {
        expect(colorRepresentationToRawColor("RGB(255, 0, 255)")).toEqual(
            MAGENTA,
        );
    });

    it("rejects malformed strings", () => {
        expect(() =>
            colorRepresentationToRawColor("rgb(255, 0)"),
        ).toThrow();
        expect(() => colorRepresentationToRawColor("not-a-color")).toThrow();
    });
});

describe("colorRepresentationToRawColor - hsv()/hsva() strings", () => {
    it("parses 'hsv(360, 50, 50, 1.0)' as a 4-component HSVA", () => {
        const raw = colorRepresentationToRawColor("hsv(360, 50, 50, 1.0)");
        expectClose(raw, [128 / 255, 64 / 255, 64 / 255, 1], 4);
    });

    it("parses 'hsva(360, 50, 50, 1.0)' identically to its 'hsv' form", () => {
        expect(
            colorRepresentationToRawColor("hsva(360, 50, 50, 1.0)"),
        ).toEqual(colorRepresentationToRawColor("hsv(360, 50, 50, 1.0)"));
    });

    it("parses pure red as 'hsv(0, 100, 100)'", () => {
        expect(colorRepresentationToRawColor("hsv(0, 100, 100)")).toEqual(RED);
    });
});

describe("colorRepresentationToRawColor - hex strings", () => {
    it("parses #RRGGBB", () => {
        expect(colorRepresentationToRawColor("#ff00ff")).toEqual(MAGENTA);
    });

    it("parses #RRGGBBAA", () => {
        const raw = colorRepresentationToRawColor("#ff00ff80");
        expectClose(raw, [1, 0, 1, 0.5], 1);
    });

    it("rejects invalid hex strings", () => {
        expect(() => colorRepresentationToRawColor("#ggg")).toThrow();
    });
});
