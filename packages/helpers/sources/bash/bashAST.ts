import { lazy } from "../async/lazy.js";
import type { Tree } from "tree-sitter";

const parser = lazy(async () => {
    try {
        const { default: Parser } = await import("tree-sitter")
        const Bash = await import("tree-sitter-bash")
        const p = new Parser()
        p.setLanguage(Bash.language as any)
        return p
    } catch (e) {
        const { default: Parser } = await import("web-tree-sitter")
        const { default: treeWasm } = await import("web-tree-sitter/tree-sitter.wasm" as string, { with: { type: "wasm" } })
        await Parser.init({
            locateFile() {
                return treeWasm
            },
        })
        const { default: bashWasm } = await import("tree-sitter-bash/tree-sitter-bash.wasm" as string, {
            with: { type: "wasm" },
        })
        const bashLanguage = await Parser.Language.load(bashWasm)
        const p = new Parser()
        p.setLanguage(bashLanguage)
        return p
    }
});


export async function bashAST(command: string) {
    return await parser().then((p) => p.parse(command)) as Tree
}