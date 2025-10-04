import { z } from "zod";

export interface Tool<A, R> {
    /// The name of the tool.
    name: string;

    /// The description of the tool.
    description: string;

    /// The parameters of the tool.
    parameters: z.ZodSchema<A>;

    /// The function to execute the tool.
    execute: (args: A) => Promise<R>;

    /// The function to check if the tool is enabled.
    isEnabled: () => boolean;

    /// The function to convert the result of the tool to a string that can be used by the LLM.
    toLLM: (result: R) => string;
}

export function tool<A, R>(config: {
    name: string;
    description: string;
    parameters: z.ZodSchema<A>;
    execute: (args: A) => Promise<R>;
    isEnabled?: () => boolean;
    toLLM?: (result: R) => string;
}): Tool<A, R> {
    return {
        name: config.name,
        description: config.description,
        parameters: config.parameters,
        execute: config.execute,
        isEnabled: config.isEnabled ?? (() => true),
        toLLM: config.toLLM ?? ((result) => JSON.stringify(result))
    };
}