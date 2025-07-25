import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../schemas";
import { MeetingStatus } from "../types";

import { generateAvatarUri } from "@/lib/avatar";
import { streamVideo } from "@/lib/stream-video-server";

import jwt from "jsonwebtoken";

function generateServerJwt() {
  const payload = {
    user_id: "server",
    exp: Math.floor(Date.now() / 1000) + 60 * 5,
  };

  return jwt.sign(payload, process.env.NEXT_VIDEO_SECRET_KEY!, {
    header: { kid: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!, alg: "HS256" },
  });
}

async function createStreamCall(meetingId: string, userId: string, meetingName: string) {
  const token = generateServerJwt();
  
  // Debug logging
  console.log("Creating Stream call with:", {
    meetingId,
    userId,
    meetingName,
    hasApiKey: !!process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY,
    hasSecretKey: !!process.env.NEXT_VIDEO_SECRET_KEY,
  });

  const res = await fetch(`https://video.stream-io-api.com/api/v1/call/default/${meetingId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        created_by_id: userId,
        custom: {
          meetingId,
          meetingName,
        },
        settings_override: {
          transcription: {
            language: "en",
            mode: "auto-on",
            closed_caption_mode: "auto-on",
          },
          recording: {
            mode: "auto-on",
            quality: "1080p",
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Stream call creation failed:", {
      status: res.status,
      statusText: res.statusText,
      error: errorText,
      url: `https://video.stream-io-api.com/api/v1/call/default/${meetingId}`,
    });
    throw new Error(`Stream call creation failed: ${errorText}`);
  }

  return res.json();
}


export const meetingsRouter = createTRPCRouter({
  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    await streamVideo.upsertUsers([
      {
        id: ctx.auth.user.id,
        name: ctx.auth.user.name,
        role: "admin",
        image:
          ctx.auth.user.image ??
          generateAvatarUri({
            seed: ctx.auth.user.id,
            variant: "initials",
          }),
      },
    ]);

    const expirationTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in seconds
    const issuedAt = Math.floor(Date.now() / 1000) - 60; // 1 minute ago in seconds

    const token = streamVideo.generateUserToken({
      user_id: ctx.auth.user.id,
      exp: expirationTime,
      iat: issuedAt,
    });

    return token;
  }),
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedMeeting] = await db
        .delete(meetings)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        )
        .returning();

      if (!removedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return removedMeeting;
    }),
  // Procedure for updating Meetings
  // Updates a Meeting by ID
  // Returns the updated Meeting
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedMeeting] = await db
        .update(meetings)
        .set(input)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        )
        .returning();

      if (!updatedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      return updatedMeeting;
    }),

  create: protectedProcedure
  .input(meetingsInsertSchema)
  .mutation(async ({ input, ctx }) => {
    const [createdMeeting] = await db
      .insert(meetings)
      .values({
        ...input,
        userId: ctx.auth.user.id,
      })
      .returning();

    // ✅ Use server-safe REST API call to create Stream call
    await createStreamCall(
      createdMeeting.id,
      ctx.auth.user.id,
      createdMeeting.name
    );

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, createdMeeting.agentId));

    if (!existingAgent) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Agent not found",
      });
    }

    await streamVideo.upsertUsers([
      {
        id: existingAgent.id,
        name: existingAgent.name,
        role: "user",
        image: generateAvatarUri({
          seed: existingAgent.name,
          variant: "botttsNeutral",
        }),
      },
    ]);

    return createdMeeting;
  }),


  // Procedures for getting Meetings
  // Retrieves a single Meeting by ID
  // Returns the Meeting along with a static participantCount of 5
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
            "duration"
          ),
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        );

      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meetings not found",
        });
      }

      return existingMeeting;
    }),

  // Procedure for getting a list of Meetings
  // Supports pagination and search functionality
  getMany: protectedProcedure
    .input(
      z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z
          .number()
          .min(MIN_PAGE_SIZE)
          .max(MAX_PAGE_SIZE)
          .default(DEFAULT_PAGE_SIZE),
        search: z.string().nullish(),
        agentId: z.string().nullish(),
        status: z
          .enum([
            MeetingStatus.Upcoming,
            MeetingStatus.Active,
            MeetingStatus.Completed,
            MeetingStatus.Processing,
            MeetingStatus.Cancelled,
          ])
          .nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, page, pageSize, status, agentId } = input;
      const data = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration: sql<number>`EXTRACT(EPOCH FROM (ended_at - started_at))`.as(
            "duration"
          ),
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
          )
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
          )
        );

      const totalPages = Math.ceil(total.count / pageSize);

      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
});
