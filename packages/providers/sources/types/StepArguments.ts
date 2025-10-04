import { z } from 'zod';

export type ToolDefinition = {
    name: string;
    description: string;
    parameters: z.ZodSchema;
}

export type StepArguments = {
    text: string;
    tools?: ToolDefinition[];
}