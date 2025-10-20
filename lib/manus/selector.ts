/**
 * Model Selector - Score-based selection using multiple factors
 */

import { type ModelCapabilities, MODEL_REGISTRY, type ModelTag } from "./model-registry"
import type { ManusPolicy } from "./policy"
import type { ModelTelemetry } from "./telemetry"

export interface SelectionScore {
  model: string
  totalScore: number
  breakdown: {
    taskFit: number
    contextFit: number
    recentLatency: number
    recentSuccess: number
    declaredBias: number
  }
}

export function selectModel(
  requiredTags: ModelTag[],
  estimatedTokens: number,
  policy: ManusPolicy,
  telemetry: ModelTelemetry,
): ModelCapabilities {
  const scores: SelectionScore[] = MODEL_REGISTRY.map((model) => {
    const breakdown = {
      taskFit: calculateTaskFit(model.tags, requiredTags),
      contextFit: calculateContextFit(model.maxContextTokens, estimatedTokens),
      recentLatency: calculateLatencyScore(model.name, telemetry),
      recentSuccess: calculateSuccessScore(model.name, telemetry),
      declaredBias: calculateBiasScore(model.declaredBias, policy.biasPreference),
    }

    const totalScore =
      breakdown.taskFit * policy.selectionWeights.taskFit +
      breakdown.contextFit * policy.selectionWeights.contextFit +
      breakdown.recentLatency * policy.selectionWeights.recentLatency +
      breakdown.recentSuccess * policy.selectionWeights.recentSuccess +
      breakdown.declaredBias * policy.selectionWeights.declaredBias

    return { model: model.name, totalScore, breakdown }
  })

  // Sort by score descending
  scores.sort((a, b) => b.totalScore - a.totalScore)

  // Return the highest scoring model
  const bestModel = MODEL_REGISTRY.find((m) => m.name === scores[0].model)!

  console.log("[v0] Model selection scores:", scores)
  console.log("[v0] Selected model:", bestModel.name, "with score:", scores[0].totalScore)

  return bestModel
}

function calculateTaskFit(modelTags: ModelTag[], requiredTags: ModelTag[]): number {
  if (requiredTags.length === 0) return 1.0

  const matches = requiredTags.filter((tag) => modelTags.includes(tag)).length
  return matches / requiredTags.length
}

function calculateContextFit(maxTokens: number, estimatedTokens: number): number {
  if (estimatedTokens > maxTokens) return 0

  const utilization = estimatedTokens / maxTokens
  // Prefer models with comfortable headroom (not too tight, not wasteful)
  if (utilization < 0.3) return 0.7 // Too much unused capacity
  if (utilization > 0.85) return 0.5 // Too tight
  return 1.0 // Sweet spot
}

function calculateLatencyScore(modelName: string, telemetry: ModelTelemetry): number {
  const stats = telemetry.getModelStats(modelName)
  if (!stats || stats.callCount === 0) return 0.5 // Neutral for unknown

  // Lower latency = higher score
  const avgLatency = stats.totalLatency / stats.callCount
  const normalized = Math.max(0, 1 - avgLatency / 10000) // 10s = 0 score
  return normalized
}

function calculateSuccessScore(modelName: string, telemetry: ModelTelemetry): number {
  const stats = telemetry.getModelStats(modelName)
  if (!stats || stats.callCount === 0) return 0.5 // Neutral for unknown

  return stats.successCount / stats.callCount
}

function calculateBiasScore(
  modelBias: { quality: number; latency: number; cost: number },
  preference: { quality: number; latency: number; cost: number },
): number {
  return (
    modelBias.quality * preference.quality + modelBias.latency * preference.latency + modelBias.cost * preference.cost
  )
}
