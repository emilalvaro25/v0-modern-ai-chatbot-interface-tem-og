import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export const runtime = "edge"

// Get system monitoring status
export async function GET(req: NextRequest) {
  try {
    const sql = getSql()

    // Get latest monitoring data for each service
    const services = await sql`
      SELECT DISTINCT ON (service_name)
        id, service_name, status, timestamp,
        cpu_usage, memory_usage, response_time_ms, error_count, metadata
      FROM system_monitoring
      ORDER BY service_name, timestamp DESC
    `

    // Get overall system health
    const healthyCount = services.filter((s: any) => s.status === "healthy").length
    const degradedCount = services.filter((s: any) => s.status === "degraded").length
    const downCount = services.filter((s: any) => s.status === "down").length

    const overallStatus =
      downCount > 0 ? "down" : degradedCount > 0 ? "degraded" : "healthy"

    return NextResponse.json({
      overallStatus,
      services,
      summary: {
        total: services.length,
        healthy: healthyCount,
        degraded: degradedCount,
        down: downCount,
      },
    })
  } catch (error) {
    console.error("Get monitoring error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching monitoring data" },
      { status: 500 }
    )
  }
}

// Report service status
export async function POST(req: NextRequest) {
  try {
    const {
      serviceName,
      status,
      cpuUsage,
      memoryUsage,
      responseTime,
      errorCount = 0,
      metadata = {},
    } = await req.json()

    if (!serviceName || !status) {
      return NextResponse.json(
        { error: "Service name and status are required" },
        { status: 400 }
      )
    }

    const sql = getSql()

    const result = await sql`
      INSERT INTO system_monitoring (
        service_name, status, cpu_usage, memory_usage,
        response_time_ms, error_count, metadata
      )
      VALUES (
        ${serviceName}, ${status}, ${cpuUsage || null}, ${memoryUsage || null},
        ${responseTime || null}, ${errorCount}, ${JSON.stringify(metadata)}
      )
      RETURNING id, service_name, status, timestamp
    `

    return NextResponse.json({
      success: true,
      monitoring: result[0],
    })
  } catch (error) {
    console.error("Report monitoring error:", error)
    return NextResponse.json(
      { error: "An error occurred while reporting status" },
      { status: 500 }
    )
  }
}

// Get historical monitoring data
export async function PUT(req: NextRequest) {
  try {
    const { serviceName, timeRange = "24h" } = await req.json()

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

    let history
    if (serviceName) {
      history = await sql`
        SELECT 
          id, service_name, status, timestamp,
          cpu_usage, memory_usage, response_time_ms, error_count, metadata
        FROM system_monitoring
        WHERE service_name = ${serviceName}
          AND timestamp > NOW() - INTERVAL ${timeWindow}
        ORDER BY timestamp DESC
        LIMIT 1000
      `
    } else {
      history = await sql`
        SELECT 
          id, service_name, status, timestamp,
          cpu_usage, memory_usage, response_time_ms, error_count, metadata
        FROM system_monitoring
        WHERE timestamp > NOW() - INTERVAL ${timeWindow}
        ORDER BY timestamp DESC
        LIMIT 1000
      `
    }

    // Calculate statistics
    const stats = {
      total: history.length,
      avgCpuUsage:
        history.reduce((sum: number, h: any) => sum + (h.cpu_usage || 0), 0) /
          history.length || 0,
      avgMemoryUsage:
        history.reduce((sum: number, h: any) => sum + (h.memory_usage || 0), 0) /
          history.length || 0,
      avgResponseTime:
        history.reduce((sum: number, h: any) => sum + (h.response_time_ms || 0), 0) /
          history.length || 0,
      totalErrors: history.reduce(
        (sum: number, h: any) => sum + (h.error_count || 0),
        0
      ),
    }

    return NextResponse.json({
      history,
      stats,
      timeRange,
    })
  } catch (error) {
    console.error("Get history error:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching history" },
      { status: 500 }
    )
  }
}
