/**
 * Policy Configuration - The "constitution" for the agent loop
 * All behavior changes happen here, not in the logic
 */

export interface ManusPolicy {
  // Loop control
  maxIterations: number
  minDeltaChars: number

  // Performance thresholds
  latencyMsThreshold: number
  contextPressureThreshold: number
  consecutiveErrorsThreshold: number

  // Quality gates
  reviewerFlagsForEscalation: ReviewerFlag[]

  // Selection weights (must sum to 1.0)
  selectionWeights: {
    taskFit: number
    contextFit: number
    recentLatency: number
    recentSuccess: number
    declaredBias: number
  }

  // Bias preferences (which declared bias to favor)
  biasPreference: {
    quality: number
    latency: number
    cost: number
  }
}

export type ReviewerFlag =
  | "hallucination"
  | "compile_error"
  | "test_failure"
  | "breaking_change"
  | "security_issue"
  | "weak_evidence"

export const DEFAULT_POLICY: ManusPolicy = {
  maxIterations: 6,
  minDeltaChars: 120,
  latencyMsThreshold: 4500,
  contextPressureThreshold: 0.85,
  consecutiveErrorsThreshold: 1,
  reviewerFlagsForEscalation: ["hallucination", "compile_error", "test_failure", "breaking_change", "security_issue"],
  selectionWeights: {
    taskFit: 0.35,
    contextFit: 0.25,
    recentLatency: 0.15,
    recentSuccess: 0.15,
    declaredBias: 0.1,
  },
  biasPreference: {
    quality: 0.6,
    latency: 0.3,
    cost: 0.1,
  },
}
