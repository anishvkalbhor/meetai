// src/lib/stream-video-server.ts
import { StreamClient } from "@stream-io/node-sdk";
import { StreamChat } from "stream-chat";

export const streamVideo = {
  chat: StreamChat.getInstance(
    process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
    process.env.NEXT_VIDEO_SECRET_KEY!
  ),
  generateUserToken: (payload: { user_id: string; exp: number; iat: number }) => {
    const jwt = require("jsonwebtoken");
    return jwt.sign(payload, process.env.NEXT_VIDEO_SECRET_KEY!, {
      algorithm: "HS256",
      header: { kid: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY! },
    });
  },
  upsertUsers: async (users: { id: string; name: string; role: string; image?: string }[]) => {
    await streamVideo.chat.upsertUsers(users);
  },
};
