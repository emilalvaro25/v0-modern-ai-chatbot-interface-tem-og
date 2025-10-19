import { NextResponse } from "next/server"
import { testOllamaConnection } from "@/lib/api-config"

export const runtime = "edge"

export async function GET() {
  try {
    const result = await testOllamaConnection()

    if (result.success) {
      return NextResponse.json({
        status: "connected",
        message: "Successfully connected to Ollama Cloud",
        endpoint: result.endpoint,
      })
    } else {
      return NextResponse.json(
        {
          status: "failed",
          message: "Failed to connect to Ollama Cloud",
          error: result.error,
          endpoint: result.endpoint,
        },
        { status: 503 },
      )
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Connection test error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
