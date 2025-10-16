import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export const runtime = "edge"

// GET - Fetch all conversations for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const sql = getSql()
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

    const sql = getSql()
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

// PATCH - Update a conversation title
export async function PATCH(req: NextRequest) {
  try {
    const { conversationId, title } = await req.json()

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 })
    }

    const sql = getSql()
    const result = await sql`
      UPDATE conversations
      SET title = ${title}, updated_at = NOW()
      WHERE id = ${conversationId}
      RETURNING id, title, model, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 })
    }

    return NextResponse.json({ conversation: result[0] })
  } catch (error) {
    console.error("[v0] Error updating conversation:", error)
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 })
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

    const sql = getSql()
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