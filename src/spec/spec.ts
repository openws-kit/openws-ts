import { z } from "zod";

const JsonSchema: z.ZodType = z.lazy(() =>
	z
		.object({
			type: z.string().optional(),
			properties: z.record(JsonSchema).optional(),
			items: JsonSchema.optional(),
			$ref: z.string().optional(),
			description: z.string().optional(),
			example: z.any().optional(),
			format: z.string().optional(),
			enum: z.array(z.any()).optional(),
			optional: z.boolean().optional(),
		})
		.refine((s) => s.$ref || s.type, {
			message: "Must have either $ref or type",
		}),
);

export type SpecJson = z.infer<typeof JsonSchema>;

const InfoSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	version: z.string().optional(),
});

export type SpecInfo = z.infer<typeof InfoSchema>;

const MethodSchema = z.object({
	description: z.string().optional(),
	params: JsonSchema.optional(),
	result: JsonSchema.optional(),
	errors: z.array(z.string()).optional(),
});

export type SpecMethod = z.infer<typeof MethodSchema>;

const SpecSchema = z.object({
	version: z.string(),
	basePath: z.string().optional(),
	info: InfoSchema,
	schemas: z.record(JsonSchema).optional(),
	methods: z.record(MethodSchema).optional(),
	events: z.record(MethodSchema).optional(),
	notifications: z.record(MethodSchema).optional(),
	errors: z.record(z.any()).optional(),
});

export type OpenWSSpec = z.infer<typeof SpecSchema>;

export function validateSpec(data: unknown): data is OpenWSSpec {
	return SpecSchema.safeParse(data).success;
}
