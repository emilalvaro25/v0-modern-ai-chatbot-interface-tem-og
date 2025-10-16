import { type NextRequest, NextResponse } from "next/server"
import { buildAIMemory, generateMemorySummary } from "@/lib/memory"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const conversationId = searchParams.get("conversationId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const memory = await buildAIMemory(userId, conversationId || undefined)
    const summary = generateMemorySummary(memory)

    return NextResponse.json({ memory, summary })
  } catch (error) {
    console.error("[v0] Memory API error:", error)
    return NextResponse.json({ error: "Failed to build memory" }, { status: 500 })
  }
}
