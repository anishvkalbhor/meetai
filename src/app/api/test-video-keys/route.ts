import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
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

    // Test if these keys work with Video API
    const response = await fetch(`https://video.stream-io-api.com/api/v1/app`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const isVideoCompatible = response.status === 200;
    const responseText = await response.text();

    return NextResponse.json({
      apiKey: apiKey.substring(0, 10) + "...",
      secretKey: secretKey.substring(0, 10) + "...",
      isVideoCompatible,
      status: response.status,
      statusText: response.statusText,
      response: responseText,
    });

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
} 