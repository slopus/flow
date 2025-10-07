import { trimIndent } from "@slopus/helpers";
import { tool } from "../Tool.js";
import { z } from "zod";
import { spawn } from "node:child_process";
import { Engine } from "../Engine.js";
import React from "react";
import { Text, Box } from "ink";

const DEFAULT_TIMEOUT_MS = 120000; // 2 minutes
const MAX_TIMEOUT_MS = 600000; // 10 minutes

interface BashResult {
    stdout: string;
    stderr: string;
    exitCode: number;
    interrupted: boolean;
}

export function createBashTool(engine: Engine) {
    return tool({
        name: 'bash',
        description: trimIndent(`
            Executes a given bash command in a persistent shell session with optional timeout, ensuring proper handling and security measures.

            IMPORTANT: This tool is for terminal operations like git, npm, docker, etc. DO NOT use it for file operations (reading, writing, editing, searching, finding files) - use the specialized tools for this instead.

            Usage notes:
            - The command argument is required.
            - You can specify an optional timeout in milliseconds (up to ${MAX_TIMEOUT_MS}ms / ${MAX_TIMEOUT_MS / 60000} minutes). If not specified, commands will timeout after ${DEFAULT_TIMEOUT_MS}ms (${DEFAULT_TIMEOUT_MS / 60000} minutes).
            - It is very helpful if you write a clear, concise description of what this command does in 5-10 words.
            - Always quote file paths that contain spaces with double quotes (e.g., cd "path with spaces/file.txt")

            - Avoid using Bash for file operations:
              - File search: Use glob (NOT find or ls)
              - Content search: Use grep (NOT grep or rg)
              - Read files: Use read (NOT cat/head/tail)
              - Edit files: Use edit (NOT sed/awk)
              - Write files: Use write (NOT echo >/cat <<EOF)

            - When issuing multiple commands:
              - If the commands are independent and can run in parallel, make multiple bash tool calls in a single message
              - If the commands depend on each other and must run sequentially, use a single bash call with '&&' to chain them together (e.g., \`git add . && git commit -m "message" && git push\`)
              - Use ';' only when you need to run commands sequentially but don't care if earlier commands fail
              - DO NOT use newlines to separate commands (newlines are ok in quoted strings)
        `),
        parameters: z.object({
            command: z.string().describe('The command to execute'),
            timeout: z.number().optional().describe(`Optional timeout in milliseconds (max ${MAX_TIMEOUT_MS})`),
            description: z.string().optional().describe(trimIndent(`
                Clear, concise description of what this command does in 5-10 words, in active voice. Examples:
                Input: ls
                Output: List files in current directory

                Input: git status
                Output: Show working tree status

                Input: npm install
                Output: Install package dependencies

                Input: mkdir foo
                Output: Create directory 'foo'
            `)),
        }),
        readOnly: false,
        execute: async (args): Promise<BashResult> => {
            const timeout = Math.min(args.timeout || DEFAULT_TIMEOUT_MS, MAX_TIMEOUT_MS);

            return new Promise((resolve, reject) => {
                let stdout = '';
                let stderr = '';
                let interrupted = false;
                let timeoutHandle: NodeJS.Timeout | null = null;

                // Spawn shell process
                const shell = spawn('/bin/bash', ['-c', args.command], {
                    cwd: engine.cwd,
                    env: process.env,
                });

                // Setup timeout
                timeoutHandle = setTimeout(() => {
                    interrupted = true;
                    shell.kill('SIGTERM');

                    // Force kill after 5 seconds if still running
                    setTimeout(() => {
                        if (!shell.killed) {
                            shell.kill('SIGKILL');
                        }
                    }, 5000);
                }, timeout);

                // Capture stdout
                shell.stdout.on('data', (data: Buffer) => {
                    stdout += data.toString();
                });

                // Capture stderr
                shell.stderr.on('data', (data: Buffer) => {
                    stderr += data.toString();
                });

                // Handle completion
                shell.on('close', (code: number | null) => {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }

                    resolve({
                        stdout: stdout.trimEnd(),
                        stderr: stderr.trimEnd(),
                        exitCode: code ?? -1,
                        interrupted
                    });
                });

                // Handle errors
                shell.on('error', (error: Error) => {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }

                    reject(new Error(`Failed to execute command: ${error.message}`));
                });
            });
        },
        toLLM: (result) => {
            const parts: string[] = [];

            // Add stdout if present
            if (result.stdout) {
                parts.push(result.stdout);
            }

            // Add stderr if present
            if (result.stderr) {
                parts.push(result.stderr);
            }

            // Add exit code if non-zero
            if (result.exitCode !== 0) {
                parts.push(`Exit code: ${result.exitCode}`);
            }

            // Add interruption notice
            if (result.interrupted) {
                parts.push('<error>Command was interrupted due to timeout</error>');
            }

            // If command failed, throw error
            if (result.exitCode !== 0 || result.interrupted) {
                throw new Error(parts.join('\n\n'));
            }

            return parts.join('\n\n');
        },
        formatTitle: (args) => {
            return <Text bold>Run command</Text>;
        },
        formatQuestion: (args) => {
            return (
                <Box flexDirection="column">
                    <Box>
                        <Text>Command: <Text bold>{args.command}</Text></Text>
                    </Box>
                    {args.description && (
                        <Box>
                            <Text dimColor>{args.description}</Text>
                        </Box>
                    )}
                    {args.timeout && (
                        <Box>
                            <Text dimColor>Timeout: {args.timeout}ms</Text>
                        </Box>
                    )}
                </Box>
            );
        }
    });
}
