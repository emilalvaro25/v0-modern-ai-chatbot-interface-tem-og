import { type NextRequest, NextResponse } from "next/server"
import { callOllamaAPI } from "@/lib/api-config"
import { getSystemPrompt } from "@/lib/system-prompt"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    // Get user from headers (added by middleware)
    const userId = req.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { transcript, model = "gpt-oss:120b-cloud" } = await req.json()

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 }
      )
    }

    const systemPrompt = getSystemPrompt()
    const requestStartTime = Date.now()

    try {
      // Call Ollama API with the transcript
      const response = await callOllamaAPI({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        stream: false,
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`)
      }

      const data = await response.json()
      const responseText = data.message?.content || ""
      const requestEndTime = Date.now()
      const latencyMs = requestEndTime - requestStartTime

      // Save benchmark data
      const sql = (await import("@/lib/database")).getSql()
      await sql`
        INSERT INTO llm_benchmarks (
          model, user_id, request_timestamp, response_timestamp, 
          latency_ms, tokens_input, tokens_output, success
        )
        VALUES (
          ${model}, ${userId}, ${new Date(requestStartTime)}, ${new Date(requestEndTime)},
          ${latencyMs}, ${transcript.split(" ").length}, ${responseText.split(" ").length}, true
        )
      `

      return NextResponse.json({
        response: responseText,
        latency_ms: latencyMs,
        model,
      })
    } catch (error) {
      console.error("LLM processing error:", error)

      // Save failed benchmark
      const sql = (await import("@/lib/database")).getSql()
      await sql`
        INSERT INTO llm_benchmarks (
          model, user_id, request_timestamp, latency_ms, success, error_message
        )
        VALUES (
          ${model}, ${userId}, ${new Date(requestStartTime)},
          ${Date.now() - requestStartTime}, false, ${String(error)}
        )
      `

      return NextResponse.json(
        { error: "Failed to process request with LLM" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Voice process error:", error)
    return NextResponse.json(
      { error: "An error occurred during processing" },
      { status: 500 }
    )
  }
}
