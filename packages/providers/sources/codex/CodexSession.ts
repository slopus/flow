import { Session } from "../types/Session.js";
import { SessionUpdate } from "../types/SessionUpdate.js";
import { StepArguments, ToolDefinition } from "../types/StepArguments.js";
import { codexRequest, isSSEEvent, CodexMessage, CodexUserMessage, CodexTool } from "./api/responses.js";
import { zodToSchema } from "./api/zodToSchema.js";

export class CodexSession implements Session {
    readonly id: string;
    readonly reasoning: "low" | "medium" | "high";
    readonly token: string;
    private history: CodexMessage[] = [];

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

    async *step(args: StepArguments): AsyncGenerator<SessionUpdate> {
        const userMessage: CodexUserMessage = {
            type: "message",
            role: "user",
            content: [
                {
                    type: "input_text",
                    text: args.text,
                }
            ],
        };

        const input = [...this.history, userMessage];

        let currentToolCallName: string | undefined;

        const tools = args.tools ? this.convertToolsToCodexFormat(args.tools) : undefined;

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
            if (isSSEEvent(event, "response.reasoning_summary_text.done")) {
                yield {
                    type: "reasoning",
                    text: event.data.text,
                };
            } else if (isSSEEvent(event, "response.output_text.done")) {
                yield {
                    type: "text",
                    text: event.data.text,
                };
            } else if (isSSEEvent(event, "response.output_item.added")) {
                const item = event.data.item as { type?: string; name?: string };
                if (item.type === "function_call" && item.name) {
                    currentToolCallName = item.name;
                }
            } else if (isSSEEvent(event, "response.function_call_arguments.done")) {
                if (currentToolCallName) {
                    yield {
                        type: "tool_call",
                        name: currentToolCallName,
                        arguments: JSON.parse(event.data.arguments),
                    };
                    currentToolCallName = undefined;
                }
            } else if (isSSEEvent(event, "response.completed")) {
                const response = event.data.response as { output?: CodexMessage[] };
                if (response?.output) {
                    this.history.push(userMessage);
                    this.history.push(...response.output);
                }
            }
        }
    }
}