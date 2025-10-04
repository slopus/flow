import { ModelProvider, ModelDescriptor, Session } from "@slopus/providers";
import { createEngineStore } from "./store.js";

export class Engine {

    readonly models = new Map<string, { descriptor: ModelDescriptor, provider: ModelProvider, priority: number }>();

    #currentModel: string;
    #currentSession: Session;
    #store: ReturnType<typeof createEngineStore>;
    #pending: string[] = [];
    #abort: AbortController | null = null;

    constructor(providers: ModelProvider[]) {

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
    }

    #startThinkingIfNeeded() {
        if (this.#abort || this.#pending.length === 0) {
            return;
        }
        const abort = new AbortController();
        this.#abort = abort;

        // Update store
        let text = this.#pending.join('\n');
        this.#pending = [];
        this.#store.getState().appendHistory({ type: 'user', text });
        this.#store.getState().setThinking(true);

        // Start thinking
    
        this.#currentSession.step({
            text,
            webSearch: true,
            callback: (update) => {
                if (abort.signal.aborted) {
                    return;
                }
                if (update.type === 'text') {
                    this.#store.getState().appendHistory({ type: 'assistant', text: update.text });
                } else if (update.type === 'tool_call') {
                    this.#store.getState().appendHistory({ type: 'tool_call', name: update.name, arguments: update.arguments });
                } else if (update.type === 'reasoning') {
                    this.#store.getState().setThinking(update.text);
                } else if (update.type === 'ended') {
                    this.#abort = null;
                    if (this.#pending.length === 0) {
                        this.#store.getState().setThinking(false);
                    } else {
                        this.#startThinkingIfNeeded();
                    }
                }
            }
        });
    }
}