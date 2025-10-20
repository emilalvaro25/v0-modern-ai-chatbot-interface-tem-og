/**
 * Task Classifier - Analyze tasks and estimate context needs
 */

import type { ModelTag } from "./model-registry"

export interface TaskClassification {
  tags: ModelTag[]
  estimatedTokens: number
  complexity: "simple" | "moderate" | "complex"
}

export function classifyTask(task: string): TaskClassification {
  const tags: ModelTag[] = []
  let estimatedTokens = 1000 // Base estimate

  // Detect code-related tasks
  if (/code|implement|function|class|api|debug|fix|refactor/i.test(task)) {
    tags.push("code")
    estimatedTokens += 2000
  }

  // Detect planning tasks
  if (/plan|design|architect|structure|organize|strategy/i.test(task)) {
    tags.push("planning")
    estimatedTokens += 1500
  }

  // Detect reasoning tasks
  if (/analyze|evaluate|compare|decide|reason|think/i.test(task)) {
    tags.push("reasoning")
    estimatedTokens += 1000
  }

  // Detect review tasks
  if (/review|check|verify|validate|test|audit/i.test(task)) {
    tags.push("review")
    estimatedTokens += 1000
  }

  // Detect long context needs
  if (task.length > 1000 || /entire|all|complete|full|comprehensive/i.test(task)) {
    tags.push("long_context")
    estimatedTokens += 5000
  }

  // Default to general if no specific tags
  if (tags.length === 0) {
    tags.push("general")
  }

  // Determine complexity
  const complexity = estimatedTokens > 5000 ? "complex" : estimatedTokens > 2000 ? "moderate" : "simple"

  return { tags, estimatedTokens, complexity }
}
