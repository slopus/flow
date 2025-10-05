import { ModelDescriptor } from "@slopus/providers";
import { create } from "zustand";

export type UIStore = {
    model: string;
    thinking: string | null;
    history: HistoryRecord[];
    composer: ComposerState;
    exitRequested: string | null;
    setModel: (model: ModelDescriptor) => void;
    setThinking: (thinking: string | boolean) => void;
    appendHistory: (record: HistoryRecord) => void;
    composerType: (text: string) => void;
    composerBackspace: () => void;
    composerDelete: () => void;
    composerSetCursor: (cursor: number) => void;
    composerMoveCursor: (delta: number) => void;
    composerSubmit: () => string | null;
    composerReset: () => void;
    composerInsertNewline: () => void;
    requestExit: (key: 'Ctrl+C' | 'Ctrl+D') => boolean;
}

export type ComposerState = {
    text: string;
    cursor: number;
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
    arguments: any;
} | {
    type: 'error',
    message: string;
} | {
    type: 'debug',
    text: string;
};

export function createEngineStore(model: ModelDescriptor) {
    let exitTimer: Timer | null = null;
    return create<UIStore>((set, get) => ({
        model: model.displayName,
        thinking: null,
        history: [],
        composer: {
            text: '',
            cursor: 0,
        },
        exitRequested: null,
        setModel: (model: ModelDescriptor) => set({ model: model.displayName }),
        setThinking: (thinking: string | boolean) => set(state => ({
            thinking: typeof thinking === 'string' ? thinking : (
                thinking === true
                    ? (state.thinking ? state.thinking : "Thinking")
                    : null
            )
        })),
        appendHistory: (record: HistoryRecord) => set(state => ({ history: [...state.history, record] })),
        composerType: (text: string) => set((state) => {
            const newText = state.composer.text.slice(0, state.composer.cursor) + text + state.composer.text.slice(state.composer.cursor);
            const newCursor = state.composer.cursor + text.length;
            return {
                composer: {
                    text: newText,
                    cursor: newCursor,
                },
            }
        }),
        composerBackspace: () => set((state) => {
            if (state.composer.cursor === 0) return state;
            const newText = state.composer.text.slice(0, state.composer.cursor - 1) + state.composer.text.slice(state.composer.cursor);
            return {
                composer: {
                    text: newText,
                    cursor: state.composer.cursor - 1,
                },
            };
        }),
        composerDelete: () => set((state) => {
            if (state.composer.cursor >= state.composer.text.length) return state;
            const newText = state.composer.text.slice(0, state.composer.cursor) + state.composer.text.slice(state.composer.cursor + 1);
            return {
                composer: {
                    text: newText,
                    cursor: state.composer.cursor,
                },
            };
        }),
        composerSetCursor: (cursor: number) => set((state) => ({
            composer: {
                ...state.composer,
                cursor: Math.max(0, Math.min(cursor, state.composer.text.length)),
            },
        })),
        composerMoveCursor: (delta: number) => set((state) => ({
            composer: {
                ...state.composer,
                cursor: Math.max(0, Math.min(state.composer.cursor + delta, state.composer.text.length)),
            },
        })),
        composerSubmit: () => {
            let text: string | null = null;
            set((state) => {
                text = state.composer.text.trim();
                if (!text) return state;
                return {
                    composer: {
                        text: '',
                        cursor: 0,
                    },
                };
            });
            return text;
        },
        composerReset: () => set({
            composer: {
                text: '',
                cursor: 0,
            },
        }),
        composerInsertNewline: () => set((state) => {
            const newText = state.composer.text.slice(0, state.composer.cursor) + '\n' + state.composer.text.slice(state.composer.cursor);
            return {
                composer: {
                    text: newText,
                    cursor: state.composer.cursor + 1,
                },
            };
        }),
        requestExit: (key: 'Ctrl+C' | 'Ctrl+D') => {
            const currentState = get();

            // Ignore if composer has text
            if (currentState.composer.text.trim() !== '') {
                // For Ctrl+C, clear the composer
                if (key === 'Ctrl+C') {
                    set({
                        composer: {
                            text: '',
                            cursor: 0,
                        },
                        exitRequested: null,
                    });
                    if (exitTimer) {
                        clearTimeout(exitTimer);
                        exitTimer = null;
                    }
                }
                return false;
            }

            if (currentState.exitRequested === key) {
                // Second request within a second - exit immediately
                if (exitTimer) {
                    clearTimeout(exitTimer);
                    exitTimer = null;
                }
                set({ exitRequested: null });
                return true;
            } else {
                // First request - set flag and start timer
                set({ exitRequested: key });
                if (exitTimer) {
                    clearTimeout(exitTimer);
                }
                exitTimer = setTimeout(() => {
                    set({ exitRequested: null });
                    exitTimer = null;
                }, 1000);
                return false;
            }
        },
    }));
}