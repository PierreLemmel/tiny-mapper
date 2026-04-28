import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        include: ["src/tests/**/*.{test,tests}.?(c|m)[jt]s?(x)"],
    },
});
