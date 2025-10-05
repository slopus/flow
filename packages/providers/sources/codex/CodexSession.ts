import { Session } from "../types/Session.js";
import { StepArguments, ToolDefinition } from "../types/StepArguments.js";
import { codexRequest, isSSEEvent, CodexMessage, CodexUserMessage, CodexTool } from "./api/responses.js";
import { zodToSchema } from "./api/zodToSchema.js";
// import { log } from "@slopus/helpers";

export class CodexSession implements Session {
    readonly id: string;
    readonly reasoning: "low" | "medium" | "high";
    readonly token: string;
    private history: any[] = [];

    constructor(id: string, reasoning: "low" | "medium" | "high", token: string) {
        this.id = id;
        this.reasoning = reasoning;
        this.token = token;
    }

    private convertToolsToCodexFormat(tools: ToolDefinition[]): CodexTool[] {
        let convertedTools: CodexTool[] = [];
        for (const tool of tools) {
            convertedTools.push({
                type: "function",
                name: tool.name,
                description: tool.description,
                strict: false,
                parameters: zodToSchema(tool.parameters)
            });
        }
        return convertedTools;
    }

    step = (args: StepArguments): { cancel: () => void } => {
        const abortController = new AbortController();

        const input = [...this.history];
        const newHistoryItems: any[] = [];

        if (args.toolResults) {
            for (const toolResult of args.toolResults) {
                input.push({
                    type: 'function_call_output',
                    call_id: toolResult.id,
                    output: toolResult.content,
                });
                newHistoryItems.push({
                    type: 'function_call_output',
                    call_id: toolResult.id,
                    output: toolResult.content,
                });
            }
        }

        if (args.text) {
            const userMessage = {
                type: "message",
                role: "user",
                content: [{ type: "input_text", text: args.text }],
            } as CodexUserMessage;
            input.push(userMessage);
            newHistoryItems.push(userMessage);
        }

        // Convert tools to Codex format
        let tools = args.tools ? this.convertToolsToCodexFormat(args.tools) : undefined;
        if (args.webSearch) {
            tools = [...(tools || []), {
                type: "web_search"
            }];
        }

        (async () => {
            // log('Current inference input', { input, tools });
            try {
                for await (const event of codexRequest({
                    model: 'gpt-5-codex',
                    input,
                    tools,
                    token: this.token,
                    sessionId: this.id,
                    reasoning: {
                        effort: this.reasoning,
                        summary: "auto",
                    },
                })) {
                    if (abortController.signal.aborted) {
                        return;
                    }
                    // log('Codex event', event.data.type, event.data);
                    // log('Codex event.event field', event.event);
                    if (isSSEEvent(event, "response.reasoning_summary_text.done")) {
                        let t = event.data.text.trim();
                        if (t.startsWith('**') && t.endsWith('**')) {
                            t = t.slice(2, -2);
                        }
                        args.callback({
                            type: "reasoning",
                            text: t,
                        });
                    } else if (isSSEEvent(event, "response.output_text.done")) {
                        args.callback({
                            type: "text",
                            text: event.data.text,
                        });
                    } else if (isSSEEvent(event, "response.output_item.done")) {
                        const item = event.data.item as CodexMessage;
                        if (item.type === "function_call") {
                            args.callback({
                                type: "tool_call",
                                id: item.call_id,
                                name: item.name,
                                arguments: JSON.parse(item.arguments),
                            });
                        }
                    } else if (isSSEEvent(event, "response.completed")) {
                        const response = event.data.response as { output: any[] };
                        // log('Codex existing history items', this.history);
                        // log('Codex new history items', newHistoryItems);
                        // log('Codex history output', response.output);
                        this.history = [...this.history, ...newHistoryItems, ...response.output];
                        // log('Current codex history', this.history);
                        // log('Response completed - sending ended event');
                    }
                    // } else {
                    //     log('Unprocessed codex event', event.data.type);
                    // }
                }
            } catch (error) {
                if (abortController.signal.aborted) {
                    return;
                }
                // Emit error event with user-facing message
                args.callback({
                    type: "error",
                    message: error instanceof Error ? error.message : String(error),
                });
            } finally { // Always send ended event
                if (abortController.signal.aborted) {
                    return;
                }
                args.callback({
                    type: "ended",
                });
            }
        })();

        return {
            cancel: () => abortController.abort(),
        };
    }
}