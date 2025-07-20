import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
  const secretKey = process.env.NEXT_VIDEO_SECRET_KEY;

  return NextResponse.json({
    hasApiKey: !!apiKey,
    hasSecretKey: !!secretKey,
    apiKeyLength: apiKey?.length || 0,
    secretKeyLength: secretKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 5) || "none",
    secretKeyPrefix: secretKey?.substring(0, 5) || "none",
  });
} 