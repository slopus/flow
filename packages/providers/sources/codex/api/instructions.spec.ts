import { describe, expect, it } from "bun:test";
import { CODEX_INSTRUCTIONS } from "./instructions.js";

describe("CODEX_INSTRUCTIONS", () => {
    it("should match snapshot", () => {
        expect(CODEX_INSTRUCTIONS).toMatchSnapshot();
    });
});