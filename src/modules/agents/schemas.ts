import { z } from "zod";

export const agentsInsertSchema = z.object({
    name: z.string().min(1, "Name is required"),
    instructions: z.string().min(1, "Instructions are required"),
    aiProvider: z.string().default("openrouter"),
    aiModel: z.string().default("mistralai/mistral-7b-instruct"),
    temperature: z.coerce.number().min(0).max(2).default(0.7),
    maxTokens: z.coerce.number().min(1).max(4000).default(1000),
  });
  
  

export const agentsUpdateSchema = agentsInsertSchema.extend({
    id: z.string().min(1, { message: "ID is required" }),
})