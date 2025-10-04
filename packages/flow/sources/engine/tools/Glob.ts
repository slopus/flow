import { trimIdent } from "@slopus/helpers";
import { tool } from "../Tool.js";
import { z } from "zod";
import { glob } from "glob";

export function createGlobTool(cwd: string) {
    return tool({
        name: 'glob',
        description: trimIdent(`
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
            const searchPath = args.path || cwd;
            const matches = await glob(args.pattern, { cwd: searchPath });
            return matches;
        },
    })
}