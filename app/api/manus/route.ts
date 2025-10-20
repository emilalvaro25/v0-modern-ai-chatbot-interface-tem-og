import type { NextRequest } from "next/server"
import { runManusLoop } from "@/lib/manus/orchestrator"
import { DEFAULT_POLICY, type ManusPolicy } from "@/lib/manus/policy"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { task, policy } = await req.json()

    if (!task) {
      return new Response("Task is required", { status: 400 })
    }

    const manusPolicy: ManusPolicy = policy || DEFAULT_POLICY

    // Create a streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of runManusLoop(task, manusPolicy)) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          console.error("[v0] Manus loop error:", error)
          controller.enqueue(encoder.encode(`\n[ERROR] ${error instanceof Error ? error.message : "Unknown error"}\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("[v0] Manus API error:", error)
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
