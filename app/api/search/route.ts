import { type NextRequest, NextResponse } from "next/server"
import { searchConversations } from "@/lib/search"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query || !userId) {
      return NextResponse.json({ error: "Query and userId are required" }, { status: 400 })
    }

    const results = await searchConversations(query, userId, limit)

    return NextResponse.json({ results })
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json({ error: "Failed to search conversations" }, { status: 500 })
  }
}
