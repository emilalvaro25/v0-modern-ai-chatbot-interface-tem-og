/**
 * Telemetry - Comprehensive logging and metrics tracking
 */

import type { ReviewerFlag } from "./roles"

export interface TurnLog {
  sessionId: string
  iteration: number
  role: "planner" | "doer" | "reviewer"
  modelName: string
  latencyMs: number
  success: boolean
  error?: string
  swapDecision?: SwapDecision
  reviewerVerdict?: "pass" | "fail"
  reviewerFlags?: ReviewerFlag[]
  timestamp: Date
}

export interface SwapDecision {
  from: string
  to: string
  reason: SwapReason
  trigger: string
}

export type SwapReason = "task_mismatch" | "context_pressure" | "high_latency" | "transport_error" | "reviewer_flags"

export interface ModelStats {
  callCount: number
  successCount: number
  totalLatency: number
  errorCount: number
}

export class ModelTelemetry {
  private logs: TurnLog[] = []
  private modelStats: Map<string, ModelStats> = new Map()

  logTurn(log: TurnLog): void {
    this.logs.push(log)

    // Update model stats
    const stats = this.modelStats.get(log.modelName) || {
      callCount: 0,
      successCount: 0,
      totalLatency: 0,
      errorCount: 0,
    }

    stats.callCount++
    stats.totalLatency += log.latencyMs
    if (log.success) {
      stats.successCount++
    } else {
      stats.errorCount++
    }

    this.modelStats.set(log.modelName, stats)

    console.log("[v0] Turn logged:", {
      iteration: log.iteration,
      role: log.role,
      model: log.modelName,
      latency: log.latencyMs,
      success: log.success,
    })
  }

  getModelStats(modelName: string): ModelStats | undefined {
    return this.modelStats.get(modelName)
  }

  getAllLogs(): TurnLog[] {
    return [...this.logs]
  }

  getSessionSummary(sessionId: string): {
    totalTurns: number
    totalSwaps: number
    averageLatency: number
    successRate: number
  } {
    const sessionLogs = this.logs.filter((l) => l.sessionId === sessionId)
    const swaps = sessionLogs.filter((l) => l.swapDecision).length
    const totalLatency = sessionLogs.reduce((sum, l) => sum + l.latencyMs, 0)
    const successes = sessionLogs.filter((l) => l.success).length

    return {
      totalTurns: sessionLogs.length,
      totalSwaps: swaps,
      averageLatency: sessionLogs.length > 0 ? totalLatency / sessionLogs.length : 0,
      successRate: sessionLogs.length > 0 ? successes / sessionLogs.length : 0,
    }
  }
}
