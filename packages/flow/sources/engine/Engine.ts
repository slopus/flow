import { ModelProvider, ModelDescriptor, Session } from "@slopus/providers";
import { createEngineStore } from "../store.js";
import { Tool } from "./Tool.js";

export class Engine {

    readonly models = new Map<string, { descriptor: ModelDescriptor, provider: ModelProvider, priority: number }>();

    #currentModel: string;
    #currentSession: Session;
    #store: ReturnType<typeof createEngineStore>;
    #pending: string[] = [];
    #pendingToolCalls: { id: string, name: string, arguments: any }[] = [];
    #pendingToolCallsResults: {
        id: string,
        content: string,
        error: boolean
    }[] = [];
    #abort: AbortController | null = null;
    #tools: Map<string, Tool<any, any>> = new Map();

    constructor(providers: ModelProvider[], tools: Tool<any, any>[]) {

        // Build models map
        let priority = 0;
        for (let provider of providers) {
            for (let model of provider.models()) {
                if (this.models.has(model.name)) {
                    throw new Error(`Model ${model.name} already exists`);
                }
                this.models.set(model.name, { descriptor: model, provider, priority });
                priority++;
            }
        }

        // Find the first model
        this.#currentModel = Array.from(this.models.values()).sort((a, b) => a.priority - b.priority)[0].descriptor.name;

        // Create session
        this.#currentSession = this.models.get(this.#currentModel)!.provider.createSession(this.#currentModel);

        // Create store
        this.#store = createEngineStore(this.model);

        // Set tools
        this.#tools = new Map(tools.map(tool => [tool.name, tool]));
    }

    get model() {
        return this.models.get(this.#currentModel)!.descriptor;
    }

    get session() {
        return this.#currentSession;
    }

    get store() {
        return this.#store;
    }

    send = (text: string) => {
        this.#pending.push(text);
        this.#startThinkingIfNeeded();
    }

    abort = () => {
        this.#abort?.abort();
        this.#pending = [];
        this.#pendingToolCalls = [];
        this.#store.getState().setThinking(false);
    }

    #startThinkingIfNeeded() {
        if (this.#abort || (this.#pending.length === 0 && this.#pendingToolCalls.length === 0)) {
            return;
        }
        const abort = new AbortController();
        this.#abort = abort;

        (async () => {

            // Execute pending tool calls
            while (this.#pendingToolCalls.length > 0 && !abort.signal.aborted) {
                const toolCall = this.#pendingToolCalls.shift();
                const tool = this.#tools.get(toolCall!.name);
                if (!tool) {
                    if (abort.signal.aborted) {
                        return;
                    }
                    this.#pendingToolCallsResults.push({ id: toolCall!.id, content: `Tool ${toolCall!.name} not found`, error: true });
                    continue;
                }

                try {
                    const result = await tool.execute(toolCall!.arguments);
                    if (abort.signal.aborted) {
                        return;
                    }
                    const toLLmResult = tool.toLLM(result);
                    this.#pendingToolCallsResults.push({ id: toolCall!.id, content: toLLmResult, error: false });
                } catch (error) {
                    if (abort.signal.aborted) {
                        return;
                    }
                    this.#pendingToolCallsResults.push({ id: toolCall!.id, content: error instanceof Error ? error.message : 'Error: ' + String(error), error: true });
                }
            }

            // Update store
            let text = this.#pending.length > 0 ? this.#pending.join('\n') : null;
            let toolResults = [...this.#pendingToolCallsResults];
            this.#pending = [];
            this.#pendingToolCallsResults = [];
            if (text) {
                this.#store.getState().appendHistory({ type: 'user', text });
            }
            this.#store.getState().setThinking(true);

            // Start thinking
            // this.#store.getState().appendHistory({ type: 'debug', text: 'start thinking' });
            this.#currentSession.step({
                text,
                toolResults,
                tools: Array.from(this.#tools.values()).map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                })),
                webSearch: true,
                callback: (update) => {
                    if (abort.signal.aborted) {
                        return;
                    }
                    if (update.type === 'text') {
                        this.#store.getState().appendHistory({ type: 'assistant', text: update.text });
                    } else if (update.type === 'tool_call') {
                        this.#pendingToolCalls.push({ id: update.id, name: update.name, arguments: update.arguments });
                        this.#store.getState().appendHistory({ type: 'tool_call', name: update.name, arguments: update.arguments });
                    } else if (update.type === 'reasoning') {
                        this.#store.getState().setThinking(update.text);
                    } else if (update.type === 'ended') {
                        // this.#store.getState().appendHistory({ type: 'debug', text: 'Ended ' + this.#pending.length + ' ' + this.#pendingToolCalls.length });
                        this.#abort = null;
                        if (this.#pending.length === 0 && this.#pendingToolCalls.length === 0) {
                            // this.#store.getState().appendHistory({ type: 'debug', text: 'stop thinking' });
                            this.#store.getState().setThinking(false);
                        } else {
                            this.#startThinkingIfNeeded();
                        }
                    }
                }
            });
        })();
    }
}