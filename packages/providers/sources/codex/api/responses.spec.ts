import { describe, expect, it } from 'bun:test';
import { CodexRequest, codexRequest, isSSEEvent, type SSEEvent } from './responses.js';

describe('ChatGPT Codex API Integration', () => {
    const token = process.env.TEST_OPENAI_TOKEN;

    if (!token) {
        throw new Error('TEST_OPENAI_TOKEN not found in environment');
    }

    it.skip('should send a request and receive SSE events', async () => {
        const request = {
            model: 'gpt-5-codex',
            input: [
                {
                    type: 'message',
                    role: 'user',
                    content: [{
                        type: 'input_text',
                        text: 'What is 2 + 2?'
                    }]
                },
            ],
            tools: [],
            token,
            sessionId: crypto.randomUUID(),
        } satisfies CodexRequest;

        const events: SSEEvent[] = [];

        for await (const event of codexRequest(request)) {
            events.push(event);

            // Stop after receiving a few events to avoid long test runs
            if (events.length >= 5) {
                break;
            }
        }

        expect(events.length).toBeGreaterThan(0);
        expect(events[0]).toHaveProperty('data');
        expect(events[0]).toHaveProperty('event');
    }, 30000); // 30 second timeout for API call

    it.skip('should parse and type-narrow SSE events correctly', async () => {
        const request = {
            model: 'gpt-5-codex',
            input: [
                {
                    type: 'message',
                    role: 'user',
                    content: [{
                        type: 'input_text',
                        text: 'Say "hello"'
                    }]
                },
            ],
            token,
            sessionId: crypto.randomUUID(),
        } satisfies CodexRequest;

        const events: SSEEvent[] = [];
        let foundResponseCreated = false;

        for await (const event of codexRequest(request)) {
            events.push(event);

            // Test type narrowing
            if (isSSEEvent(event, 'response.created')) {
                foundResponseCreated = true;
                expect(event.data.response).toBeDefined();
                expect(event.data.response.id).toBeDefined();
            }

            if (isSSEEvent(event, 'response.output_text.delta')) {
                expect(event.data.delta).toBeDefined();
                expect(typeof event.data.delta).toBe('string');
            }

            if (events.length >= 10) {
                break;
            }
        }

        expect(events.length).toBeGreaterThan(0);
        expect(foundResponseCreated).toBe(true);
    }, 30000);
});
