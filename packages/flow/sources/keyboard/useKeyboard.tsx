import { useInput } from "ink";
import * as React from "react";
import { log } from "../log.js";

export type KeyboardEvent =
    | { type: 'text', text: string }
    | { type: 'command', command: KeyCommand };

export type KeyCommand =
    | 'Enter'
    | 'Shift+Enter'
    | 'Backspace'
    | 'Delete'
    | 'Left'
    | 'Right'
    | 'Up'
    | 'Down'
    | 'Ctrl+A'
    | 'Ctrl+E'
    | 'Ctrl+C'
    | 'Ctrl+D'
    | 'Tab'
    | 'Shift+Tab';

type KeyboardListener = (event: KeyboardEvent) => void;

interface KeyboardContextValue {
    subscribe: (listener: KeyboardListener) => () => void;
}

const KeyboardContext = React.createContext<KeyboardContextValue | null>(null);

export const KeyboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const listenersRef = React.useRef<Set<KeyboardListener>>(new Set());

    const subscribe = React.useCallback((listener: KeyboardListener) => {
        listenersRef.current.add(listener);
        return () => {
            listenersRef.current.delete(listener);
        };
    }, []);

    const emit = React.useCallback((event: KeyboardEvent) => {
        listenersRef.current.forEach(listener => listener(event));
    }, []);

    // Handle SIGINT (Ctrl+C) as a keyboard event
    React.useEffect(() => {
        const handleSigInt = () => {
            emit({ type: 'command', command: 'Ctrl+C' });
        };

        process.on('SIGINT', handleSigInt);

        return () => {
            process.off('SIGINT', handleSigInt);
        };
    }, [emit]);

    useInput((input, key) => {
        log('useInput received:', { input, key });

        // Ctrl+C
        if (key.ctrl && input === 'c') {
            emit({ type: 'command', command: 'Ctrl+C' });
            return;
        }

        // Ctrl+D
        if (key.ctrl && input === 'd') {
            emit({ type: 'command', command: 'Ctrl+D' });
            return;
        }

        // Shift+Tab
        if (key.shift && key.tab) {
            emit({ type: 'command', command: 'Shift+Tab' });
            return;
        }

        // Tab
        if (key.tab && !key.shift) {
            emit({ type: 'command', command: 'Tab' });
            return;
        }

        // Ctrl+A (Home)
        if (key.ctrl && input === 'a') {
            emit({ type: 'command', command: 'Ctrl+A' });
            return;
        }

        // Ctrl+E (End)
        if (key.ctrl && input === 'e') {
            emit({ type: 'command', command: 'Ctrl+E' });
            return;
        }

        // Shift+Enter (newline)
        if (input && input.includes('\r') && !key.return) {
            emit({ type: 'command', command: 'Shift+Enter' });
            return;
        }

        // Enter
        if (key.return) {
            emit({ type: 'command', command: 'Enter' });
            return;
        }

        // Backspace (delete backwards) - Backspace key
        if (key.backspace) {
            emit({ type: 'command', command: 'Backspace' });
            return;
        }

        // Delete key - backwards on macOS, forwards on Linux
        // On macOS: regular Delete is backwards (same as backspace)
        // On Linux: Delete is forwards
        // To distinguish: check meta/ctrl modifiers for fn+Delete on macOS
        if (key.delete) {
            // For now, treat all delete as backspace
            // TODO: detect fn+Delete for forward delete on macOS
            emit({ type: 'command', command: 'Backspace' });
            return;
        }

        // Arrow keys
        if (key.leftArrow) {
            emit({ type: 'command', command: 'Left' });
            return;
        }

        if (key.rightArrow) {
            emit({ type: 'command', command: 'Right' });
            return;
        }

        if (key.upArrow) {
            emit({ type: 'command', command: 'Up' });
            return;
        }

        if (key.downArrow) {
            emit({ type: 'command', command: 'Down' });
            return;
        }

        // Regular text input (filter out control characters)
        if (input && !key.ctrl && !key.meta) {
            const cleanInput = input.replace(/[\r\n]/g, '');
            if (cleanInput) {
                emit({ type: 'text', text: cleanInput });
            }
        }
    });

    const value = React.useMemo(() => ({ subscribe }), [subscribe]);

    return (
        <KeyboardContext.Provider value={value}>
            {children}
        </KeyboardContext.Provider>
    );
};

export const useKeyboard = (handler: KeyboardListener) => {
    const context = React.useContext(KeyboardContext);

    if (!context) {
        throw new Error('useKeyboard must be used within KeyboardProvider');
    }

    React.useEffect(() => {
        return context.subscribe(handler);
    }, [context, handler]);
};
