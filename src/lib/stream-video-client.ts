"use client";

import { StreamVideoClient } from "@stream-io/video-react-sdk";

export const streamVideoClient = new StreamVideoClient({
  apiKey: process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
});
