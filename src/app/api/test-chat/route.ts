import { NextResponse } from "next/server";
import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Test if we can query agents
    const agentsList = await db
      .select()
      .from(agents)
      .limit(5);

    return NextResponse.json({
      success: true,
      agentsCount: agentsList.length,
      agents: agentsList,
    });
  } catch (error) {
    console.error("Test chat error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
} 