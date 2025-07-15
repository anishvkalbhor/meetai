import {
  CallEndedEvent,
  MessageNewEvent,
  CallTranscriptionReadyEvent,
  CallSessionParticipantLeftEvent,
  CallRecordingReadyEvent,
  CallSessionStartedEvent,
} from "@stream-io/node-sdk";

import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video-server";
import { inngest } from "@/inngest/client";
import { askAgent } from "@/lib/openrouter";

import jwt from "jsonwebtoken";

// src/app/api/webhook/route.ts
async function joinStreamCallSession(meetingId: string, agentId: string) {
  console.log(`Joining agent ${agentId} to meeting ${meetingId}`);
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!;
    const secret = process.env.NEXT_VIDEO_SECRET_KEY!;
    const response = await fetch(
      `https://video.stream-io-api.com/api/v1/call/default/${meetingId}/join`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${generateJwt(apiKey, secret)}`,
        },
        body: JSON.stringify({ agentId }),
      }
    );
    console.log(`Response from Stream.io API: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      console.error(`Error joining call: ${await response.text()}`);
    }
  } catch (error) {
    console.error(`Failed to join agent ${agentId} to meeting ${meetingId}: ${error}`);
  }
}

// src/app/api/webhook/route.ts
async function handleCallSessionStartedEvent(event: CallSessionStartedEvent) {
  try {
    const meetingId = (event as any).meetingId;
    const agentId = (event as any).agentId;
    await joinStreamCallSession(meetingId, agentId);
    console.log(`Agent joined meeting ${meetingId}`);
  } catch (error) {
    console.error(`Failed to join meeting: ${error}`);
  }
}

async function endStreamCallSession(meetingId: string) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!;
  const secret = process.env.NEXT_VIDEO_SECRET_KEY!;

  const response = await fetch(
    `https://video.stream-io-api.com/api/v1/call/default/${meetingId}/end`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${generateJwt(apiKey, secret)}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to end call: ${error}`);
  }

  return await response.json();
}

function generateJwt(apiKey: string, apiSecret: string) {
  const payload = {
    user_id: "server",
    exp: Math.floor(Date.now() / 1000) + 60 * 5,
  };

  return jwt.sign(payload, apiSecret, {
    algorithm: "HS256",
    header: { kid: apiKey, alg: "HS256" },
  });
}

// ✅ Signature verification
function verifySignatureWithSDK(body: string, signature: string): boolean {
  const secret = process.env.NEXT_VIDEO_SECRET_KEY!;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body, "utf-8")
    .digest("hex");

  return expected === signature;
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apikey = req.headers.get("x-api-key");

  if (!signature || !apikey) {
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 }
    );
  }

  const body = await req.text();

  if (!verifySignatureWithSDK(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const eventType = (payload as Record<string, unknown>)?.type;

  // ✅ Handle call.session_started
  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing meeting ID in call session started event" },
        { status: 400 }
      );
    }

    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, "completed")),
          not(eq(meetings.status, "active")),
          not(eq(meetings.status, "cancelled")),
          not(eq(meetings.status, "processing"))
        )
      );

    if (!existingMeeting) {
      return NextResponse.json(
        { error: "Meeting not found or already completed" },
        { status: 404 }
      );
    }

    await db
      .update(meetings)
      .set({ status: "active", startedAt: new Date() })
      .where(eq(meetings.id, existingMeeting.id));

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      return NextResponse.json(
        { error: "Agent not found for the meeting" },
        { status: 404 }
      );
    }

    try {
      const agentIntro = await askAgent({
        messages: [
          {
            role: "system",
            content:
              existingAgent.instructions ??
              "You are a helpful AI agent in a meeting.",
          },
          {
            role: "user",
            content: "The meeting has started. Please greet the participants.",
          },
        ],
      });

      // Upsert agent as chat user
      await streamVideo.chat.upsertUser({
        id: existingAgent.id,
        name: existingAgent.name,
      });

      // Send agent message to videocall chat channel
      const channel = streamVideo.chat.channel("videocall", meetingId);
      await channel.create();
      await channel.sendMessage({
        text: agentIntro,
        user_id: existingAgent.id,
      });
    } catch (err) {
      console.error("Error asking agent or sending message:", err);
      return NextResponse.json(
        { error: "Failed to process AI agent greeting" },
        { status: 500 }
      );
    }

    // ✅ Handle participant leaving
  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1];

    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing meeting ID in participant left event" },
        { status: 400 }
      );
    }

    // Use callSessions API to end call
    await endStreamCallSession(meetingId);

    // ✅ Handle call end
  } else if (eventType === "call.session_ended") {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing meeting ID in call ended event" },
        { status: 400 }
      );
    }

    await db
      .update(meetings)
      .set({ status: "processing", endedAt: new Date() })
      .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));

    // ✅ Handle transcription
  } else if (eventType === "call.transcription_ready") {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid.split(":")[1];

    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        transcriptUrl: event.call_transcription.url,
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json(
        { error: "Meeting not found for transcription" },
        { status: 404 }
      );
    }

    await inngest.send({
      name: "meetings/processing",
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcriptUrl,
      },
    });

    // ✅ Handle recording
  } else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid.split(":")[1];

    await db
      .update(meetings)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(eq(meetings.id, meetingId));
  }

  return NextResponse.json({ status: "ok" });
}
