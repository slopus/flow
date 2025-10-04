import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { zodToSchema } from "./zodToSchema.js";

describe("zodToSchema", () => {
    it("should convert a string schema", () => {
        const schema = z.string();
        const result = zodToSchema(schema);

        expect(result).toEqual({ type: "string" });
    });

    it("should convert a number schema", () => {
        const schema = z.number();
        const result = zodToSchema(schema);

        expect(result).toEqual({ type: "number" });
    });

    it("should convert a boolean schema", () => {
        const schema = z.boolean();
        const result = zodToSchema(schema);

        expect(result).toEqual({ type: "boolean" });
    });

    it("should convert an object schema with properties", () => {
        const schema = z.object({
            name: z.string(),
            age: z.number(),
            active: z.boolean(),
        });
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "object",
            properties: {
                name: { type: "string" },
                age: { type: "number" },
                active: { type: "boolean" },
            },
            required: ["name", "age", "active"],
            additionalProperties: false,
        });
    });

    it("should convert an object schema with optional properties", () => {
        const schema = z.object({
            name: z.string(),
            email: z.string().optional(),
        });
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "object",
            properties: {
                name: { type: "string" },
                email: { type: "string" },
            },
            required: ["name"],
            additionalProperties: false,
        });
    });

    it("should convert an array schema", () => {
        const schema = z.array(z.string());
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "array",
            items: { type: "string" },
        });
    });

    it("should convert nested object schemas", () => {
        const schema = z.object({
            user: z.object({
                name: z.string(),
                address: z.object({
                    street: z.string(),
                    city: z.string(),
                }),
            }),
        });
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "object",
            properties: {
                user: {
                    type: "object",
                    properties: {
                        name: { type: "string" },
                        address: {
                            type: "object",
                            properties: {
                                street: { type: "string" },
                                city: { type: "string" },
                            },
                            required: ["street", "city"],
                            additionalProperties: false,
                        },
                    },
                    required: ["name", "address"],
                    additionalProperties: false,
                },
            },
            required: ["user"],
            additionalProperties: false,
        });
    });

    it("should convert enum schemas", () => {
        const schema = z.enum(["red", "green", "blue"]);
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "string",
            enum: ["red", "green", "blue"],
        });
    });

    it("should convert union schemas", () => {
        const schema = z.union([z.string(), z.number()]);
        const result = zodToSchema(schema);

        expect(result).toEqual({
            anyOf: [{ type: "string" }, { type: "number" }],
        });
    });

    it("should convert schemas with descriptions", () => {
        const schema = z.string().describe("A user's name");
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "string",
            description: "A user's name",
        });
    });

    it("should convert schemas with default values", () => {
        const schema = z.string().default("John");
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "string",
            default: "John",
        });
    });

    it("should convert array of objects", () => {
        const schema = z.array(
            z.object({
                id: z.number(),
                name: z.string(),
            })
        );
        const result = zodToSchema(schema);

        expect(result).toEqual({
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "number" },
                    name: { type: "string" },
                },
                required: ["id", "name"],
                additionalProperties: false,
            },
        });
    });
});
