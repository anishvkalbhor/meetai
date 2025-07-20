import { z } from "zod";

export const chatSessionInsertSchema = z.object({
    agentId: z.string().min(1, "Agent is required"),
    title: z.string().optional(),
});

export const chatSessionUpdateSchema = z.object({
    id: z.string().min(1, { message: "ID is required" }),
    agentId: z.string().optional(),
    title: z.string().optional(),
    status: z.string().optional(),
});

export const chatMessageInsertSchema = z.object({
    sessionId: z.string().min(1, "Session ID is required"),
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1, "Message content is required"),
});

export const chatMessageUpdateSchema = chatMessageInsertSchema.extend({
    id: z.string().min(1, { message: "ID is required" }),
}); 