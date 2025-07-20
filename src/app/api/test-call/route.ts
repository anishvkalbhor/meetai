import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
    const secretKey = process.env.NEXT_VIDEO_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json({
        error: "Missing Stream.io configuration",
        hasApiKey: !!apiKey,
        hasSecretKey: !!secretKey,
      });
    }

    // Generate a test token
    const testToken = jwt.sign(
      {
        user_id: "test-user",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000) - 60,
      },
      secretKey,
      {
        algorithm: "HS256",
        header: { kid: apiKey, alg: "HS256" },
      }
    );

    // Test call creation
    const testCallId = `test-call-${Date.now()}`;
    const response = await fetch(`https://video.stream-io-api.com/api/v1/call/default/${testCallId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${testToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: {
          created_by_id: "test-user",
          custom: {
            test: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        error: "Call creation failed",
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
    }

    const result = await response.json();

    // Clean up
    await fetch(`https://video.stream-io-api.com/api/v1/call/default/${testCallId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Call creation test successful",
      callId: testCallId,
      result,
    });

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
} 