import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const PRIMARY_API = process.env.OLLAMA_CLOUD_API || "https://api.ollama.ai"
const FALLBACK_API = "http://168.231.78.113:11434"
const API_KEY = process.env.OLLAMA_API_KEY || ""

async function callLLMAPI(endpoint: string, body: any, usePrimary = true): Promise<Response> {
  const baseURL = usePrimary ? PRIMARY_API : FALLBACK_API
  const url = `${baseURL}${endpoint}`

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (usePrimary && API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok && usePrimary) {
      console.log("[System] Primary endpoint failed, trying fallback...")
      return callLLMAPI(endpoint, body, false)
    }

    return response
  } catch (error) {
    if (usePrimary) {
      console.log("[System] Primary endpoint unreachable, using fallback...")
      return callLLMAPI(endpoint, body, false)
    }
    throw error
  }
}

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
      response = await callLLMAPI("/api/chat", {
        model: titleModel,
        messages: [{ role: "user", content: titlePrompt }],
        stream: false,
        temperature: 0.7,
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
