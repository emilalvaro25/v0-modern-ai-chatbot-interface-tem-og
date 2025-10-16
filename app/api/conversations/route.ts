import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export const runtime = "edge"

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch all conversations for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const conversations = await sql`
      SELECT id, title, model, created_at, updated_at
      FROM conversations
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("[v0] Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

// POST - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const { userId, title, model } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO conversations (user_id, title, model)
      VALUES (${userId}, ${title || "New Conversation"}, ${model || "gpt-oss:120b-cloud"})
      RETURNING id, title, model, created_at, updated_at
    `

    return NextResponse.json({ conversation: result[0] })
  } catch (error) {
    console.error("[v0] Error creating conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}

// DELETE - Delete a conversation
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    await sql`
      DELETE FROM conversations
      WHERE id = ${conversationId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting conversation:", error)
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
  }
}
