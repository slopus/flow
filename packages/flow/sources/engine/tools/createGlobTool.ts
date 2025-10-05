import { trimIndent } from "@slopus/helpers";
import { tool } from "../Tool.js";
import { z } from "zod";
import { glob } from "glob";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { Engine } from "../Engine.js";

export function createGlobTool(engine: Engine) {
    return tool({
        name: 'glob',
        description: trimIndent(`
            - Fast file pattern matching tool that works with any codebase size
            - Supports glob patterns like "**/*.js" or "src/**/*.ts"
            - Returns matching file paths sorted by modification time
            - Use this tool when you need to find files by name patterns
            - When you are doing an open ended search that may require multiple rounds of globbing and grepping, use the Agent tool instead
            - You have the capability to call multiple tools in a single response. It is always better to speculatively perform multiple searches as a batch that are potentially useful.
        `),
        parameters: z.object({
            pattern: z.string().describe('The glob pattern to match files against'),
            path: z.string().optional().describe("The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter \"undefined\" or \"null\" - simply omit it for the default behavior. Must be a valid directory path if provided."),
        }),
        execute: async (args) => {
            const searchPath = args.path || engine.cwd;
            const matches = await glob(args.pattern, { cwd: searchPath });
            const filesWithTimes = await Promise.all(matches.map(async (match) => {
                try {
                    const fileStat = await stat(resolve(searchPath, match));
                    return { match, mtime: fileStat.mtimeMs };
                } catch {
                    return { match, mtime: 0 };
                }
            }));
            filesWithTimes.sort((a, b) => b.mtime - a.mtime);
            return filesWithTimes.map((item) => item.match);
        },
    })
}