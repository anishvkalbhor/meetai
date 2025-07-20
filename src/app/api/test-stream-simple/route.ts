import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
    const secretKey = process.env.NEXT_VIDEO_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({
        error: "Missing API keys",
        hasApiKey: !!apiKey,
        hasSecretKey: !!secretKey,
      });
    }

    // Test if this is a Video app by checking the app info
    const response = await fetch(`https://video.stream-io-api.com/api/v1/app`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      apiKey: apiKey.substring(0, 10) + "...",
      secretKey: secretKey.substring(0, 10) + "...",
      isVideoApp: response.status === 200,
    });

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
} 