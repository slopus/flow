import { z } from "zod";

export function zodToSchema(zodSchema: z.ZodSchema) {
    let schema = z.toJSONSchema(zodSchema);
    delete schema.$schema;
    return schema as any;
}