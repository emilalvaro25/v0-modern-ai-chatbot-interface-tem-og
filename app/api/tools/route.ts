import { type NextRequest, NextResponse } from "next/server"
import { executeTool } from "@/lib/tools"

export async function POST(req: NextRequest) {
  try {
    const { tool_name, arguments: args } = await req.json()

    if (!tool_name) {
      return NextResponse.json({ error: "Missing tool_name parameter" }, { status: 400 })
    }

    console.log("[v0] Tool API called:", tool_name)

    const result = await executeTool(tool_name, args || {})

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Tool execution error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
