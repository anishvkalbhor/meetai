import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY;
    const secretKey = process.env.NEXT_VIDEO_SECRET_KEY;

    console.log("Testing Stream.io configuration:", {
      hasApiKey: !!apiKey,
      hasSecretKey: !!secretKey,
      apiKeyLength: apiKey?.length || 0,
      secretKeyLength: secretKey?.length || 0,
    });

    if (!apiKey || !secretKey) {
      return NextResponse.json({
        error: "Missing Stream.io configuration",
        hasApiKey: !!apiKey,
        hasSecretKey: !!secretKey,
      }, { status: 500 });
    }

    // Test JWT generation
    console.log("Generating test JWT...");
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

    console.log("JWT generated successfully, length:", testToken.length);

    // Test API call
    const testCallId = `test-${Date.now()}`;
    console.log("Testing API call with call ID:", testCallId);
    
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

    console.log("API response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stream.io API test failed:", errorText);
      return NextResponse.json({
        error: "Stream.io API test failed",
        status: response.status,
        statusText: response.statusText,
        details: errorText,
        callId: testCallId,
        tokenLength: testToken.length,
      }, { status: 500 });
    }

    const result = await response.json();
    console.log("API call successful:", result);

    // Clean up test call
    console.log("Cleaning up test call...");
    const cleanupResponse = await fetch(`https://video.stream-io-api.com/api/v1/call/default/${testCallId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${testToken}`,
      },
    });

    console.log("Cleanup response:", cleanupResponse.status);

    return NextResponse.json({
      success: true,
      message: "Stream.io configuration is working",
      callId: testCallId,
      result,
    });

  } catch (error) {
    console.error("Stream.io test failed:", error);
    return NextResponse.json({
      error: "Stream.io test failed",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 