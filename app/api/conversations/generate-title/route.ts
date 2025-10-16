import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

// POST - Generate a conversation title based on messages
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

    const response = await fetch("https://api.ollama.cloud/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: titleModel,
        messages: [{ role: "user", content: titlePrompt }],
        stream: false,
        temperature: 0.7,
        max_tokens: 20,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json()
    let title = data.choices?.[0]?.message?.content?.trim() || "New Chat"

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
    console.error("[v0] Error generating title:", error)
    return NextResponse.json({ error: "Failed to generate title" }, { status: 500 })
  }
}
