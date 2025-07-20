import { db } from "@/db";
import { chatSessions, chatMessages, agents } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { chatSessionInsertSchema, chatSessionUpdateSchema, chatMessageInsertSchema } from "../schemas";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { askAIAgent } from "@/lib/ai-service";

export const chatRouter = createTRPCRouter({
  // Create a new chat session
  createSession: protectedProcedure
    .input(chatSessionInsertSchema)
    .mutation(async ({ input, ctx }) => {
      const [createdSession] = await db
        .insert(chatSessions)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();

      return createdSession;
    }),

  // Get chat sessions for a user
  getSessions: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize } = input;
      const data = await db
        .select({
          ...getTableColumns(chatSessions),
          agent: agents,
          messageCount: sql<number>`(
            SELECT COUNT(*) FROM chat_messages 
            WHERE chat_messages.session_id = chat_sessions.id
          )`.as("message_count"),
        })
        .from(chatSessions)
        .innerJoin(agents, eq(chatSessions.agentId, agents.id))
        .where(
          and(
            eq(chatSessions.userId, ctx.auth.user.id),
            search ? ilike(chatSessions.title, `%${search}%`) : undefined
          )
        )
        .orderBy(desc(chatSessions.updatedAt), desc(chatSessions.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(chatSessions)
        .where(
          and(
            eq(chatSessions.userId, ctx.auth.user.id),
            search ? ilike(chatSessions.title, `%${search}%`) : undefined
          )
        );

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),

  // Get a single chat session with messages
  getSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [session] = await db
        .select({
          ...getTableColumns(chatSessions),
          agent: agents,
        })
        .from(chatSessions)
        .innerJoin(agents, eq(chatSessions.agentId, agents.id))
        .where(
          and(
            eq(chatSessions.id, input.id),
            eq(chatSessions.userId, ctx.auth.user.id)
          )
        );

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found",
        });
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.id))
        .orderBy(chatMessages.timestamp);

      return {
        session,
        messages,
      };
    }),

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        content: z.string().min(1, "Message cannot be empty"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get the session and agent
      const [session] = await db
        .select({
          ...getTableColumns(chatSessions),
          agent: agents,
        })
        .from(chatSessions)
        .innerJoin(agents, eq(chatSessions.agentId, agents.id))
        .where(
          and(
            eq(chatSessions.id, input.sessionId),
            eq(chatSessions.userId, ctx.auth.user.id)
          )
        );

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found",
        });
      }

      // Save user message
      const [userMessage] = await db
        .insert(chatMessages)
        .values({
          sessionId: input.sessionId,
          role: "user",
          content: input.content,
        })
        .returning();

      // Get conversation history
      const conversationHistory = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.timestamp);

      // Prepare messages for AI
      const messages = conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      // Add system message with agent instructions
      messages.unshift({
        role: "system",
        content: session.agent.instructions,
      });

      // Get AI response
      const aiResponse = await askAIAgent({
        messages,
        provider: session.agent.aiProvider || "openrouter",
        model: session.agent.aiModel || "mistralai/mistral-7b-instruct",
        temperature: parseFloat(session.agent.temperature || "0.7"),
        maxTokens: parseInt(session.agent.maxTokens || "1000"),
      });

      // Save AI response
      const [assistantMessage] = await db
        .insert(chatMessages)
        .values({
          sessionId: input.sessionId,
          role: "assistant",
          content: aiResponse,
        })
        .returning();

      // Update session timestamp
      await db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, input.sessionId));

      return {
        userMessage,
        assistantMessage,
      };
    }),

  // Update session title
  updateSession: protectedProcedure
    .input(chatSessionUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedSession] = await db
        .update(chatSessions)
        .set(input)
        .where(
          and(
            eq(chatSessions.id, input.id),
            eq(chatSessions.userId, ctx.auth.user.id)
          )
        )
        .returning();

      if (!updatedSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found",
        });
      }

      return updatedSession;
    }),

  // Delete session
  deleteSession: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [deletedSession] = await db
        .delete(chatSessions)
        .where(
          and(
            eq(chatSessions.id, input.id),
            eq(chatSessions.userId, ctx.auth.user.id)
          )
        )
        .returning();

      if (!deletedSession) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found",
        });
      }

      return deletedSession;
    }),

  // Generate chat summary
  generateSummary: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Get the session and messages
      const [session] = await db
        .select({
          ...getTableColumns(chatSessions),
          agent: agents,
        })
        .from(chatSessions)
        .innerJoin(agents, eq(chatSessions.agentId, agents.id))
        .where(
          and(
            eq(chatSessions.id, input.sessionId),
            eq(chatSessions.userId, ctx.auth.user.id)
          )
        );

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Chat session not found",
        });
      }

      const messages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, input.sessionId))
        .orderBy(chatMessages.timestamp);

      if (messages.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No messages to summarize",
        });
      }

      // Create conversation text for summary
      const conversationText = messages
        .map((msg) => `${msg.role === "user" ? "User" : session.agent.name}: ${msg.content}`)
        .join("\n\n");

      // Generate summary using AI
      const summary = await askAIAgent({
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that creates concise summaries of conversations. Focus on the key points, decisions made, and important information shared.",
          },
          {
            role: "user",
            content: `Please provide a concise summary of this conversation:\n\n${conversationText}`,
          },
        ],
        provider: session.agent.aiProvider || "openrouter",
        model: session.agent.aiModel || "mistralai/mistral-7b-instruct",
        temperature: parseFloat(session.agent.temperature || "0.7"),
        maxTokens: parseInt(session.agent.maxTokens || "500"),
      });

      return { summary };
    }),
}); 