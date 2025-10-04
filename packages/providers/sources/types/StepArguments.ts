import { z } from 'zod';
import { SessionUpdate } from './SessionUpdate.js';

export type ToolDefinition = {
    name: string;
    description: string;
    parameters: z.ZodSchema;
}

export type StepArguments = {
    text: string;
    callback: (update: SessionUpdate) => void;
    tools?: ToolDefinition[];
    webSearch?: boolean;
}