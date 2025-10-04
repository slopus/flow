import { randomUUID } from "crypto";
import { ModelProvider } from "../types/ModelProvider.js";
import { CodexSession } from "./CodexSession.js";

export function createCodexProvider(token: string): ModelProvider {
    return {
        name: "codex",
        displayName: "OpenAI Codex (Subscription)",
        models: async () => {
            return [
                {
                    name: "gpt-5-codex-high",
                    displayName: "GPT-5 Codex (High)",
                },
                {
                    name: "gpt-5-codex-medium",
                    displayName: "GPT-5 Codex (Medium)",
                },
                {
                    name: "gpt-5-codex-low",
                    displayName: "GPT-5 Codex (Low)",
                },
            ];
        },
        createSession: async (model: string) => {
            if (model === "gpt-5-codex-high") {
                return new CodexSession(randomUUID(), "high", token);
            }
            if (model === "gpt-5-codex-medium") {
                return new CodexSession(randomUUID(), "medium", token);
            }
            if (model === "gpt-5-codex-low") {
                return new CodexSession(randomUUID(), "low", token);
            }
            throw new Error(`Unknown model: ${model}`);
        },
    };
}