import { describe, expect, it } from "vitest";
import { findDuplicates } from "../../lib/core/utils";

describe("findDuplicates", () => {
    it("returns an empty array when all keys are unique", () => {
        const items = [{ name: "a" }, { name: "b" }, { name: "c" }];
        expect(findDuplicates(items, (item) => item.name)).toEqual([]);
    });

    it("groups items that share the same key", () => {
        const items = [
            { name: "a", line: 1 },
            { name: "b", line: 2 },
            { name: "a", line: 5 },
            { name: "a", line: 9 },
        ];
        const dupes = findDuplicates(items, (item) => item.name);
        expect(dupes).toHaveLength(1);
        expect(dupes[0].key).toBe("a");
        expect(dupes[0].items.map((i) => i.line)).toEqual([1, 5, 9]);
    });

    it("returns one entry per distinct duplicated key", () => {
        const items = [
            { name: "a" },
            { name: "b" },
            { name: "a" },
            { name: "b" },
            { name: "c" },
        ];
        const dupes = findDuplicates(items, (item) => item.name);
        expect(dupes.map((d) => d.key).sort()).toEqual(["a", "b"]);
    });

    it("preserves insertion order of duplicated keys", () => {
        const items = [
            { name: "z" },
            { name: "a" },
            { name: "z" },
            { name: "a" },
        ];
        const dupes = findDuplicates(items, (item) => item.name);
        expect(dupes.map((d) => d.key)).toEqual(["z", "a"]);
    });

    it("works on plain string arrays via identity key", () => {
        const dupes = findDuplicates(["x", "y", "x", "z"], (s) => s);
        expect(dupes).toHaveLength(1);
        expect(dupes[0]).toEqual({ key: "x", items: ["x", "x"] });
    });

    it("handles an empty input", () => {
        expect(findDuplicates([], (s: string) => s)).toEqual([]);
    });
});
