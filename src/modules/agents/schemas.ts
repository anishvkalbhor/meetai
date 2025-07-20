import { z } from "zod";

export const agentsInsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  instructions: z.string().min(1, "Instructions are required"),
  aiProvider: z.string().min(1),
  aiModel: z.string().min(1),
  temperature: z
    .number({
      required_error: "Temperature is required",
      invalid_type_error: "Temperature must be a number",
    })
    .min(0)
    .max(2),
  maxTokens: z
    .number({
      required_error: "Max Tokens is required",
      invalid_type_error: "Max Tokens must be a number",
    })
    .min(1)
    .max(4000),
});


export const agentsUpdateSchema = agentsInsertSchema.extend({
  id: z.string().min(1, { message: "ID is required" }),
});


