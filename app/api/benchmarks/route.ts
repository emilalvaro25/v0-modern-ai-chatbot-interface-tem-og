import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export const runtime = "edge"

// Get benchmarks
export async function GET(req: NextRequest) {
  try {
    // Get user from headers (added by middleware)
    const userId = req.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const model = searchParams.get("model")

    const sql = getSql()

    let benchmarks
    if (model) {
      benchmarks = await sql`
        SELECT 
          id, model, user_id, request_timestamp, response_timestamp,
          latency_ms, tokens_input, tokens_output, energy_usage_mwh,
          success, error_message, metadata
        FROM llm_benchmarks
        WHERE user_id = ${userId} AND model = ${model}
        ORDER BY request_timestamp DESC
        LIMIT ${limit}
      `
    } else {
      benchmarks = await sql`
        SELECT 
          id, model, user_id, request_timestamp, response_timestamp,
          latency_ms, tokens_input, tokens_output, energy_usage_mwh,
          success, error_message, metadata
        FROM llm_benchmarks
        WHERE user_id = ${userId}
        ORDER BY request_timestamp DESC
        LIMIT ${limit}
      `
    }

    // Calculate statistics
    const stats = {
      total: benchmarks.length,
      avgLatency: benchmarks.reduce((sum: number, b: any) => sum + (b.latency_ms || 0), 0) / benchmarks.length || 0,
      minLatency: Math.min(...benchmarks.map((b: any) => b.latency_ms || Infinity)),
      maxLatency: Math.max(...benchmarks.map((b: any) => b.latency_ms || 0)),
      successRate: benchmarks.filter((b: any) => b.success).length / benchmarks.length || 0,
      totalTokensInput: benchmarks.reduce((sum: number, b: any) => sum + (b.tokens_input || 0), 0),
      totalTokensOutput: benchmarks.reduce((sum: number, b: any) => sum + (b.tokens_output || 0), 0),
      totalEnergyUsage: benchmarks.reduce((sum: number, b: any) => sum + (b.energy_usage_mwh || 0), 0),
    }

    return NextResponse.json({
      benchmarks,
      stats,
    })
  } catch (error) {
    console.error("Get benchmarks error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching benchmarks" },
      { status: 500 }
    )
  }
}

// Create benchmark
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

    const {
      model,
      conversationId,
      latency,
      tokensInput,
      tokensOutput,
      energyUsage,
      success = true,
      errorMessage,
      metadata = {},
    } = await req.json()

    if (!model) {
      return NextResponse.json(
        { error: "Model is required" },
        { status: 400 }
      )
    }

    const sql = getSql()

    const result = await sql`
      INSERT INTO llm_benchmarks (
        model, user_id, conversation_id, latency_ms,
        tokens_input, tokens_output, energy_usage_mwh,
        success, error_message, metadata
      )
      VALUES (
        ${model}, ${userId}, ${conversationId || null}, ${latency || null},
        ${tokensInput || null}, ${tokensOutput || null}, ${energyUsage || null},
        ${success}, ${errorMessage || null}, ${JSON.stringify(metadata)}
      )
      RETURNING id, model, latency_ms, tokens_input, tokens_output, success
    `

    return NextResponse.json({
      success: true,
      benchmark: result[0],
    })
  } catch (error) {
    console.error("Create benchmark error:", error)
    return NextResponse.json(
      { error: "An error occurred while creating benchmark" },
      { status: 500 }
    )
  }
}

// Get aggregate statistics
export async function PUT(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { timeRange = "24h" } = await req.json()

    // Calculate time window
    let timeWindow
    switch (timeRange) {
      case "1h":
        timeWindow = "1 hour"
        break
      case "24h":
        timeWindow = "24 hours"
        break
      case "7d":
        timeWindow = "7 days"
        break
      case "30d":
        timeWindow = "30 days"
        break
      default:
        timeWindow = "24 hours"
    }

    const sql = getSql()

    // Get aggregate statistics by model
    const modelStats = await sql`
      SELECT 
        model,
        COUNT(*) as total_requests,
        AVG(latency_ms) as avg_latency,
        MIN(latency_ms) as min_latency,
        MAX(latency_ms) as max_latency,
        SUM(tokens_input) as total_tokens_input,
        SUM(tokens_output) as total_tokens_output,
        SUM(energy_usage_mwh) as total_energy_usage,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
      FROM llm_benchmarks
      WHERE user_id = ${userId}
        AND request_timestamp > NOW() - INTERVAL ${timeWindow}
      GROUP BY model
      ORDER BY total_requests DESC
    `

    // Get hourly trend data
    const trendData = await sql`
      SELECT 
        DATE_TRUNC('hour', request_timestamp) as hour,
        COUNT(*) as requests,
        AVG(latency_ms) as avg_latency,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate
      FROM llm_benchmarks
      WHERE user_id = ${userId}
        AND request_timestamp > NOW() - INTERVAL ${timeWindow}
      GROUP BY DATE_TRUNC('hour', request_timestamp)
      ORDER BY hour DESC
    `

    return NextResponse.json({
      modelStats,
      trendData,
      timeRange,
    })
  } catch (error) {
    console.error("Get statistics error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching statistics" },
      { status: 500 }
    )
  }
}
