import { describe, it, expect } from "bun:test";
import { bashAST } from "./bashAST.js";

describe("bashAST", () => {
    it("should parse a simple bash command", async () => {
        const tree = await bashAST("echo hello");
        expect(tree).toBeDefined();
        expect(tree.rootNode).toBeDefined();
        expect(tree.rootNode.type).toBe("program");
    });

    it("should parse a command with pipe", async () => {
        const tree = await bashAST("ls | grep test");
        expect(tree).toBeDefined();
        expect(tree.rootNode.type).toBe("program");
    });
});
