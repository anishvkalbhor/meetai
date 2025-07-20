import { NextResponse } from "next/server";
import { appRouter } from "@/trpc/routers/_app";

export async function GET() {
  try {
    // Test if the chat router is accessible
    const router = appRouter;
    const procedures = Object.keys(router._def.procedures);
    
    return NextResponse.json({
      success: true,
      procedures,
      chatProcedures: procedures.filter(p => p.startsWith('chat.')),
    });
  } catch (error) {
    console.error("Test chat procedures error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 