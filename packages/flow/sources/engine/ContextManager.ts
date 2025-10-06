import { defaultModeEnabledPrompt, editModeEnabledPrompt } from "./context/prompts.js";
import { Engine } from "./Engine.js";

export class ContextManager {

    #engine: Engine;

    constructor(engine: Engine) {
        this.#engine = engine;
    }

    resolve(): string[] {
        const mode = this.#engine.mode;

        // Allow all edits mode
        if (mode.slug === 'allow-edits') {
            return [editModeEnabledPrompt];
        }

        if (mode.slug === 'default') {
            return [defaultModeEnabledPrompt];
        }

        return [];
    }
}
