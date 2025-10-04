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