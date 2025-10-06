import { z } from "zod";
import type { ReactElement } from "react";

export interface Tool<A, R> {
    /// The name of the tool.
    name: string;

    /// The description of the tool.
    description: string;

    /// The parameters of the tool.
    parameters: z.ZodSchema<A>;

    /// Whether this tool only reads data without making modifications.
    readOnly: boolean;

    /// The function to execute the tool.
    execute: (args: A) => Promise<R>;

    /// The function to check if the tool is enabled.
    isEnabled: () => boolean;

    /// The function to convert the result of the tool to a string that can be used by the LLM.
    toLLM: (result: R) => string;

    /// The function to format the title for the permission prompt.
    formatTitle?: (args: A) => ReactElement;

    /// The function to format the question for the permission prompt.
    formatQuestion?: (args: A) => ReactElement;
}

export function tool<A, R>(config: {
    name: string;
    description: string;
    parameters: z.ZodSchema<A>;
    readOnly?: boolean;
    execute: (args: A) => Promise<R>;
    isEnabled?: () => boolean;
    toLLM?: (result: R) => string;
    formatTitle?: (args: A) => ReactElement;
    formatQuestion?: (args: A) => ReactElement;
}): Tool<A, R> {
    return {
        name: config.name,
        description: config.description,
        parameters: config.parameters,
        readOnly: config.readOnly ?? false,
        execute: config.execute,
        isEnabled: config.isEnabled ?? (() => true),
        toLLM: config.toLLM ?? ((result) => JSON.stringify(result)),
        formatTitle: config.formatTitle,
        formatQuestion: config.formatQuestion
    };
}