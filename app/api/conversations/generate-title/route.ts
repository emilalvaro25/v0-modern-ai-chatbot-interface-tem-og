import { type NextRequest, NextResponse } from "next/server"
import { fetchWithFallback } from "@/lib/api-config"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 })
    }

    const titleModel = model || "gpt-oss:20b-cloud"

    const titlePrompt = `Based on this conversation, generate a concise 3-4 word title that captures the main topic. Only respond with the title, nothing else.

Conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}

Title:`

    let response: Response
    try {
      response = await fetchWithFallback("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          model: titleModel,
          messages: [{ role: "user", content: titlePrompt }],
          stream: false,
          temperature: 0.7,
        }),
      })
    } catch (error) {
      return NextResponse.json({ title: "New Chat" })
    }

    if (!response.ok) {
      return NextResponse.json({ title: "New Chat" })
    }

    const data = await response.json()
    let title = data.message?.content?.trim() || "New Chat"

    title = title
      .replace(/^["']|["']$/g, "")
      .replace(/[.!?]$/g, "")
      .trim()

    const words = title.split(/\s+/)
    if (words.length > 4) {
      title = words.slice(0, 4).join(" ")
    }

    return NextResponse.json({ title })
  } catch (error) {
    return NextResponse.json({ title: "New Chat" })
  }
}
