import { z } from "zod";
import { CODEX_INSTRUCTIONS } from "./instructions.js";

// ============================================================================
// Types
// ============================================================================

export type CodexInputTextContent = {
    type: "input_text";
    text: string;
};

export type CodexOutputTextContent = {
    type: "output_text";
    text: string;
};

export type CodexSummaryTextContent = {
    type: "summary_text";
    text: string;
};

export type CodexContentItem =
    | CodexInputTextContent
    | CodexOutputTextContent
    | CodexSummaryTextContent;

export type CodexUserMessage = {
    type: "message";
    role: "user";
    content: CodexInputTextContent[];
};

export type CodexAssistantMessage = {
    type: "message";
    role: "assistant";
    content: CodexOutputTextContent[];
};

export type CodexReasoningMessage = {
    type: "reasoning";
    summary: CodexSummaryTextContent[];
    content: null;
    encrypted_content: string;
};

export type CodexFunctionCallMessage = {
    type: "function_call";
    id: string;
    status: "in_progress" | "completed";
    arguments: string;
    call_id: string;
    name: string;
};

export type CodexFunctionCallOutputMessage = {
    type: "function_call_output";
    call_id: string;
    output: string;
};

export type CodexMessage =
    | CodexUserMessage
    | CodexAssistantMessage
    | CodexReasoningMessage
    | CodexFunctionCallMessage
    | CodexFunctionCallOutputMessage;

export interface CodexTool {
    type: string;
    [key: string]: unknown;
}

export interface CodexRequest {
    model: string;
    input: CodexMessage[];
    tools?: CodexTool[];
    token: string;
    sessionId: string;
    reasoning?: {
        effort: "low" | "medium" | "high";
        summary: "auto" | "detailed";
    };
}

// ============================================================================
// SSE Event Schemas
// ============================================================================

const sseResponseCreatedSchema = z.object({
    type: z.literal("response.created"),
    sequence_number: z.number(),
    response: z.object({
        id: z.string(),
        status: z.string(),
    }).passthrough(),
});

const sseResponseInProgressSchema = z.object({
    type: z.literal("response.in_progress"),
    sequence_number: z.number(),
});

const sseOutputItemAddedSchema = z.object({
    type: z.literal("response.output_item.added"),
    sequence_number: z.number(),
    output_index: z.number(),
    item: z.object({
        id: z.string(),
        type: z.string(),
    }).passthrough(),
});

const sseOutputItemDoneSchema = z.object({
    type: z.literal("response.output_item.done"),
    sequence_number: z.number(),
    output_index: z.number(),
    item: z.unknown(),
});

const sseReasoningSummaryPartAddedSchema = z.object({
    type: z.literal("response.reasoning_summary_part.added"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    summary_index: z.number(),
    part: z.object({
        type: z.string(),
        text: z.string(),
    }),
});

const sseReasoningSummaryTextDeltaSchema = z.object({
    type: z.literal("response.reasoning_summary_text.delta"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    summary_index: z.number(),
    delta: z.string(),
    obfuscation: z.string().optional(),
});

const sseReasoningSummaryTextDoneSchema = z.object({
    type: z.literal("response.reasoning_summary_text.done"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    summary_index: z.number(),
    text: z.string(),
});

const sseReasoningSummaryPartDoneSchema = z.object({
    type: z.literal("response.reasoning_summary_part.done"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    summary_index: z.number(),
    part: z.object({
        type: z.string(),
        text: z.string(),
    }),
});

const sseOutputTextDeltaSchema = z.object({
    type: z.literal("response.output_text.delta"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    content_index: z.number(),
    delta: z.string(),
    logprobs: z.array(z.unknown()),
    obfuscation: z.string().optional(),
});

const sseOutputTextDoneSchema = z.object({
    type: z.literal("response.output_text.done"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    content_index: z.number(),
    text: z.string(),
    logprobs: z.array(z.unknown()),
});

const sseContentPartAddedSchema = z.object({
    type: z.literal("response.content_part.added"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    content_index: z.number(),
    part: z.object({
        type: z.string(),
    }).passthrough(),
});

const sseContentPartDoneSchema = z.object({
    type: z.literal("response.content_part.done"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    content_index: z.number(),
    part: z.unknown(),
});

const sseResponseCompletedSchema = z.object({
    type: z.literal("response.completed"),
    sequence_number: z.number(),
    response: z.unknown(),
});

const sseWebSearchCallSchema = z.object({
    type: z.union([
        z.literal("response.web_search_call.in_progress"),
        z.literal("response.web_search_call.searching"),
        z.literal("response.web_search_call.completed"),
    ]),
    sequence_number: z.number(),
    output_index: z.number(),
    item_id: z.string(),
});

const sseAnnotationAddedSchema = z.object({
    type: z.literal("response.output_text.annotation.added"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    content_index: z.number(),
    annotation_index: z.number(),
    annotation: z.unknown(),
});

const sseFunctionCallArgumentsDeltaSchema = z.object({
    type: z.literal("response.function_call_arguments.delta"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    delta: z.string(),
    obfuscation: z.string().optional(),
});

const sseFunctionCallArgumentsDoneSchema = z.object({
    type: z.literal("response.function_call_arguments.done"),
    sequence_number: z.number(),
    item_id: z.string(),
    output_index: z.number(),
    arguments: z.string(),
});

const sseGenericSchema = z.object({
    type: z.string(),
    sequence_number: z.number().optional(),
}).passthrough();

export const sseEventDataSchema = z.discriminatedUnion("type", [
    sseResponseCreatedSchema,
    sseResponseInProgressSchema,
    sseOutputItemAddedSchema,
    sseOutputItemDoneSchema,
    sseReasoningSummaryPartAddedSchema,
    sseReasoningSummaryTextDeltaSchema,
    sseReasoningSummaryTextDoneSchema,
    sseReasoningSummaryPartDoneSchema,
    sseOutputTextDeltaSchema,
    sseOutputTextDoneSchema,
    sseContentPartAddedSchema,
    sseContentPartDoneSchema,
    sseResponseCompletedSchema,
    sseWebSearchCallSchema,
    sseAnnotationAddedSchema,
    sseFunctionCallArgumentsDeltaSchema,
    sseFunctionCallArgumentsDoneSchema,
]).or(sseGenericSchema);

export type SSEEventData = z.infer<typeof sseEventDataSchema>;

// Fully typed SSE events with discriminated union on event field
export type SSEEvent =
    | { event: "response.created"; data: z.infer<typeof sseResponseCreatedSchema> }
    | { event: "response.in_progress"; data: z.infer<typeof sseResponseInProgressSchema> }
    | { event: "response.output_item.added"; data: z.infer<typeof sseOutputItemAddedSchema> }
    | { event: "response.output_item.done"; data: z.infer<typeof sseOutputItemDoneSchema> }
    | { event: "response.reasoning_summary_part.added"; data: z.infer<typeof sseReasoningSummaryPartAddedSchema> }
    | { event: "response.reasoning_summary_text.delta"; data: z.infer<typeof sseReasoningSummaryTextDeltaSchema> }
    | { event: "response.reasoning_summary_text.done"; data: z.infer<typeof sseReasoningSummaryTextDoneSchema> }
    | { event: "response.reasoning_summary_part.done"; data: z.infer<typeof sseReasoningSummaryPartDoneSchema> }
    | { event: "response.output_text.delta"; data: z.infer<typeof sseOutputTextDeltaSchema> }
    | { event: "response.output_text.done"; data: z.infer<typeof sseOutputTextDoneSchema> }
    | { event: "response.content_part.added"; data: z.infer<typeof sseContentPartAddedSchema> }
    | { event: "response.content_part.done"; data: z.infer<typeof sseContentPartDoneSchema> }
    | { event: "response.completed"; data: z.infer<typeof sseResponseCompletedSchema> }
    | { event: "response.web_search_call.in_progress"; data: z.infer<typeof sseWebSearchCallSchema> }
    | { event: "response.web_search_call.searching"; data: z.infer<typeof sseWebSearchCallSchema> }
    | { event: "response.web_search_call.completed"; data: z.infer<typeof sseWebSearchCallSchema> }
    | { event: "response.output_text.annotation.added"; data: z.infer<typeof sseAnnotationAddedSchema> }
    | { event: "response.function_call_arguments.delta"; data: z.infer<typeof sseFunctionCallArgumentsDeltaSchema> }
    | { event: "response.function_call_arguments.done"; data: z.infer<typeof sseFunctionCallArgumentsDoneSchema> }
    | { event?: string; data: z.infer<typeof sseGenericSchema> }; // fallback for unknown events

/**
 * Type guard to narrow SSEEvent based on event type
 */
export function isSSEEvent<T extends SSEEvent["event"]>(
    event: SSEEvent,
    type: T
): event is Extract<SSEEvent, { event: T }> {
    return event.event === type;
}

// ============================================================================
// API Client
// ============================================================================

const CODEX_API_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses";
const DEFAULT_VERSION = "0.41.0";
const DEFAULT_USER_AGENT = "codex_cli_rs/0.41.0 (Mac OS 26.0.0; arm64)";
const DEFAULT_ORIGINATOR = "codex_cli_rs";

/**
 * Extract account ID from JWT token
 */
function extractAccountIdFromToken(jwtToken: string): string {
    const payload = jwtToken.split('.')[1];
    if (!payload) {
        throw new Error('Invalid JWT token: missing payload');
    }
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    const accountId = decoded['https://api.openai.com/auth']?.chatgpt_account_id;
    if (!accountId) {
        throw new Error('Invalid JWT token: missing chatgpt_account_id');
    }
    return accountId;
}

/**
 * Parse Server-Sent Events from a ReadableStream
 */
async function* parseSSE(stream: ReadableStream<Uint8Array>): AsyncGenerator<SSEEvent> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            let eventName: string | undefined;
            let dataString: string | undefined;

            for (const line of lines) {
                if (line.trim() === "") {
                    // Empty line signals end of event
                    if (dataString !== undefined) {
                        // Try to parse and validate the data
                        try {
                            const parsed = JSON.parse(dataString);
                            const validated = sseEventDataSchema.parse(parsed);
                            yield {
                                event: eventName,
                                data: validated,
                            };
                        } catch (error) {
                            // Ignore invalid events
                            console.warn("Invalid SSE event data:", error);
                        }
                        eventName = undefined;
                        dataString = undefined;
                    }
                    continue;
                }

                const colonIndex = line.indexOf(":");
                if (colonIndex === -1) continue;

                const field = line.slice(0, colonIndex);
                const value = line.slice(colonIndex + 1).trim();

                switch (field) {
                    case "event":
                        eventName = value;
                        break;
                    case "data":
                        dataString = dataString ? `${dataString}\n${value}` : value;
                        break;
                }
            }

            // Yield final event if buffer ended with data
            if (dataString !== undefined) {
                try {
                    const parsed = JSON.parse(dataString);
                    const validated = sseEventDataSchema.parse(parsed);
                    yield {
                        event: eventName,
                        data: validated,
                    };
                } catch (error) {
                    // Ignore invalid events
                    console.warn("Invalid SSE event data:", error);
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
}

/**
 * Send a request to the ChatGPT Codex API and return a streaming response with all SSE events
 * (including delta events for incremental text updates)
 */
export async function* codexRequest(
    request: CodexRequest
): AsyncGenerator<SSEEvent> {
    const accountId = extractAccountIdFromToken(request.token);

    const headers: Record<string, string> = {
        "authorization": `Bearer ${request.token}`,
        "version": DEFAULT_VERSION,
        "openai-beta": "responses=experimental",
        "conversation_id": request.sessionId,
        "session_id": request.sessionId,
        "accept": "text/event-stream",
        "content-type": "application/json",
        "chatgpt-account-id": accountId,
        "user-agent": DEFAULT_USER_AGENT,
        "originator": DEFAULT_ORIGINATOR,
        "host": "chatgpt.com",
    };

    const requestBody = {
        model: request.model,
        instructions: CODEX_INSTRUCTIONS,
        input: request.input,
        tools: request.tools,
        tool_choice: "auto",
        parallel_tool_calls: false,
        reasoning: request.reasoning || {
            effort: "high",
            summary: "auto",
        },
        store: false,
        stream: true,
        include: ["reasoning.encrypted_content"],
        prompt_cache_key: request.sessionId,
    };

    const response = await fetch(CODEX_API_ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `ChatGPT Codex API error: ${response.status} ${response.statusText}\n${errorText}`
        );
    }

    if (!response.body) {
        throw new Error("No response body received from ChatGPT Codex API");
    }

    yield* parseSSE(response.body);
}