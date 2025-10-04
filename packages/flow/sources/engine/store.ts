import { ModelDescriptor } from "@slopus/providers";
import { create } from "zustand";

export type EngineStore = {
    model: string;
    thinking: string | null;
    history: HistoryRecord[];
    setModel: (model: ModelDescriptor) => void;
    setThinking: (thinking: string | boolean) => void;
    appendHistory: (record: HistoryRecord) => void;
}

export type HistoryRecord = {
    type: 'user',
    text: string;
} | {
    type: 'assistant',
    text: string;
} | {
    type: 'tool_call',
    name: string,
    arguments: string;
};

export function createEngineStore(model: ModelDescriptor) {
    return create<EngineStore>((set) => ({
        model: model.displayName,
        thinking: null,
        history: [],
        setModel: (model: ModelDescriptor) => set({ model: model.displayName }),
        setThinking: (thinking: string | boolean) => set(state => ({
            thinking: typeof thinking === 'string' ? thinking : (
                thinking === true
                    ? (state.thinking ? null : "Thinking")
                    : null
            )
        })),
        appendHistory: (record: HistoryRecord) => set(state => ({ history: [...state.history, record] })),
    }));
}