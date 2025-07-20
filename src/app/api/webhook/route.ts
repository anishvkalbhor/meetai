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
import { askAIAgent } from "@/lib/ai-service";

import jwt from "jsonwebtoken";

// src/app/api/webhook/route.ts
async function joinStreamCallSession(meetingId: string, agentId: string) {
  console.log(`Joining agent ${agentId} to meeting ${meetingId}`);
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!;
    const secret = process.env.NEXT_VIDEO_SECRET_KEY!;
    
    // First, create a user token for the agent
    const agentToken = jwt.sign(
      {
        user_id: agentId,
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        iat: Math.floor(Date.now() / 1000) - 60,
      },
      secret,
      {
        algorithm: "HS256",
        header: { kid: apiKey, alg: "HS256" },
      }
    );

    // Join the agent to the call using the REST API
    const response = await fetch(
      `https://video.stream-io-api.com/api/v1/call/default/${meetingId}/join`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agentToken}`,
        },
        body: JSON.stringify({
          user: {
            id: agentId,
            name: "AI Agent",
            role: "user",
          },
        }),
      }
    );
    
    console.log(`Response from Stream.io API: ${response.status} ${response.statusText}`);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error joining call: ${errorText}`);
      throw new Error(`Failed to join agent: ${errorText}`);
    }
    
    console.log(`Successfully joined agent ${agentId} to meeting ${meetingId}`);
  } catch (error) {
    console.error(`Failed to join agent ${agentId} to meeting ${meetingId}: ${error}`);
    throw error;
  }
}

// src/app/api/webhook/route.ts
async function handleCallSessionStartedEvent(event: CallSessionStartedEvent) {
  try {
    const meetingId = event.call.custom?.meetingId;
    if (!meetingId) {
      console.error("No meetingId found in call session started event");
      return;
    }

    // Get the meeting and agent details
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(eq(meetings.id, meetingId));

    if (!existingMeeting) {
      console.error(`Meeting ${meetingId} not found`);
      return;
    }

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      console.error(`Agent ${existingMeeting.agentId} not found`);
      return;
    }

    // Join the agent to the call
    await joinStreamCallSession(meetingId, existingAgent.id);
    console.log(`Agent ${existingAgent.name} joined meeting ${meetingId}`);
  } catch (error) {
    console.error(`Failed to handle call session started: ${error}`);
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

  console.log("Webhook received:", {
    signature: signature ? "present" : "missing",
    apikey: apikey ? "present" : "missing",
    method: req.method,
    url: req.url,
  });

  if (!signature || !apikey) {
    console.error("Missing signature or API key in webhook");
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 }
    );
  }

  const body = await req.text();

  if (!verifySignatureWithSDK(body, signature)) {
    console.error("Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    console.error("Invalid JSON payload in webhook");
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const eventType = (payload as Record<string, unknown>)?.type;
  console.log("Processing webhook event:", eventType);

  // ✅ Handle call.session_started
  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    console.log("Call session started:", { meetingId, event });

    if (!meetingId) {
      console.error("Missing meeting ID in call session started event");
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
      console.error(`Meeting ${meetingId} not found or already completed`);
      return NextResponse.json(
        { error: "Meeting not found or already completed" },
        { status: 404 }
      );
    }

    console.log("Found meeting:", existingMeeting);

    await db
      .update(meetings)
      .set({ status: "active", startedAt: new Date() })
      .where(eq(meetings.id, existingMeeting.id));

    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));

    if (!existingAgent) {
      console.error(`Agent ${existingMeeting.agentId} not found`);
      return NextResponse.json(
        { error: "Agent not found for the meeting" },
        { status: 404 }
      );
    }

    console.log("Found agent:", existingAgent);

    try {
      // Join the agent to the call first
      await joinStreamCallSession(meetingId, existingAgent.id);

      // Then send the greeting message
      const agentIntro = await askAIAgent({
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
        provider: existingAgent.aiProvider || "openrouter",
        model: existingAgent.aiModel || "mistralai/mistral-7b-instruct",
        temperature: parseFloat(existingAgent.temperature || "0.7"),
        maxTokens: parseInt(existingAgent.maxTokens || "1000"),
      });

      console.log("Agent intro generated:", agentIntro);

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

      console.log("Agent greeting sent successfully");
    } catch (err) {
      console.error("Error joining agent or sending message:", err);
      return NextResponse.json(
        { error: "Failed to join agent or send greeting" },
        { status: 500 }
      );
    }

    // ✅ Handle participant leaving
  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1];

    console.log("Participant left:", { meetingId, event });

    if (!meetingId) {
      return NextResponse.json(
        { error: "Missing meeting ID in participant left event" },
        { status: 400 }
      );
    }

    // Only end the call if it's the last participant
    // For participant left events, we can't easily determine remaining count
    // So we'll end the call when any participant leaves
    try {
      await endStreamCallSession(meetingId);
      console.log("Call ended successfully");
    } catch (error) {
      console.error("Failed to end call session:", error);
    }

    // ✅ Handle call end
  } else if (eventType === "call.session_ended") {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    console.log("Call session ended:", { meetingId, event });

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

    console.log("Transcription ready:", { meetingId, event });

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

    console.log("Recording ready:", { meetingId, event });

    await db
      .update(meetings)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(eq(meetings.id, meetingId));
  }

  console.log("Webhook processed successfully");
  return NextResponse.json({ status: "ok" });
}
