import { db } from "@/db";
import { agents, meetings, user } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import JSONL from "jsonl-parse-stringify";
import { createAgent, gemini, TextMessage } from "@inngest/agent-kit";

import { StreamChat } from "stream-chat";
import { askAIAgent } from "@/lib/ai-service";

const model = gemini({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY!,
});

const summarizer = createAgent({
  name: "summarizer",
  model,
  system:
    `You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.
`.trim(),
});



export const meetingsProcessing = inngest.createFunction(
  { id: "meetings/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    try {
      const response = await step.run("fetch-transcript", async () => {
        return fetch(event.data.transcriptUrl).then((res) => res.text());
      });

      const transcript = await step.run("parse-transcript", async () => {
        return JSONL.parse<StreamTranscriptItem>(response);
      });

      const transcriptWithSpeakers = await step.run("add-speakers", async () => {
        const speakerIds = [
          ...new Set(transcript.map((item) => item.speaker_id)),
        ];

        const userSpeakers = await db
          .select()
          .from(user)
          .where(inArray(user.id, speakerIds))
          .then((users) =>
            users.map((user) => ({
              ...user,
            }))
          );
        const agentSpeakers = await db
          .select()
          .from(agents)
          .where(inArray(agents.id, speakerIds))
          .then((agents) =>
            agents.map((agent) => ({
              ...agent,
            }))
          );

        const speakers = [...userSpeakers, ...agentSpeakers];

        return transcript.map((item) => {
          const speaker = speakers.find(
            (speaker) => speaker.id === item.speaker_id
          );
          if (!speaker) {
            return {
              ...item,
              user: {
                name: "Unknown",
              },
            };
          }

          return {
            ...item,
            user: {
              name: speaker.name,
            },
          };
        });
      });

      const { output } = await summarizer.run(
        JSON.stringify(transcriptWithSpeakers)
      );

      await step.run("save-summary", async () => {
        await db
          .update(meetings)
          .set({
            summary: (output[0] as TextMessage).content as string,
            status: "completed",
          })
          .where(eq(meetings.id, event.data.meetingId));
      });
    } catch (error) {
      console.error("Meeting processing failed:", error);
      // Mark meeting as completed even if processing fails
      await db
        .update(meetings)
        .set({ status: "completed" })
        .where(eq(meetings.id, event.data.meetingId));
    }
  }
);

export const handleChatMessage = inngest.createFunction(
  { id: "meetings/chat-message" },
  { event: "events/chat.message.sent" },
  async ({ event, step }) => {
    try {
      const { meetingId, message, agentId } = event.data;

      // 1. Get agent instructions from DB
      const [agent] = await step.run("fetch-agent-instructions", () => {
        return db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
      });

      if (!agent || !agent.instructions) {
        // No instructions, so do nothing.
        return;
      }

      // 2. Run the chat agent with custom instructions
      const responseText = await askAIAgent({
        messages: [
          {
            role: "system",
            content: agent.instructions,
          },
          {
            role: "user",
            content: message,
          },
        ],
        provider: agent.aiProvider || "openrouter",
        model: agent.aiModel || "mistralai/mistral-7b-instruct",
        temperature: parseFloat(agent.temperature || "0.7"),
        maxTokens: parseInt(agent.maxTokens || "1000"),
      });

      // 3. Send the response back to the Stream chat
      await step.run("send-chat-response", async () => {
        const client = StreamChat.getInstance(
          process.env.STREAM_API_KEY!,
          process.env.STREAM_SECRET!
        );

        const channel = client.channel("messaging", meetingId, {
          members: [agentId],
        });

        await channel.create(); // No-op if already exists

        const { message } = await channel.sendMessage({
          text: responseText,
          user_id: agentId,
        });

        return { message };
      });

      return { message: "Response sent" };
    } catch (error) {
      console.error("Chat message handling failed:", error);
      return { error: "Failed to process chat message" };
    }
  }
);
