/**
 * Main Orchestrator - The Manus-style agent loop
 * Planner → Doer → Reviewer with automatic model swapping
 */

import { streamText } from "ai"
import { createOllama } from "ollama-ai-provider"
import { createOllamaCloud } from "../llm-providers"
import { type ManusPolicy, DEFAULT_POLICY } from "./policy"
import { ModelTelemetry, type SwapReason } from "./telemetry"
import { classifyTask } from "./classifier"
import { selectModel } from "./selector"
import type { ModelCapabilities } from "./model-registry"
import {
  PLANNER_PROMPT,
  DOER_PROMPT,
  REVIEWER_PROMPT,
  type PlannerOutput,
  type DoerOutput,
  type ReviewerOutput,
  type PlanStep,
} from "./roles"
import { nanoid } from "nanoid"

export interface ManusSession {
  sessionId: string
  task: string
  policy: ManusPolicy
  telemetry: ModelTelemetry
  currentModel: ModelCapabilities
  plan?: PlannerOutput
  currentStep: number
  workingContext: string
  iterations: number
}

export async function* runManusLoop(task: string, policy: ManusPolicy = DEFAULT_POLICY): AsyncGenerator<string> {
  const sessionId = nanoid()
  const telemetry = new ModelTelemetry()

  // Phase 4: Classify the task
  const classification = classifyTask(task)
  yield `[EBURON] Task classified: ${classification.tags.join(", ")} (${classification.complexity})\n`
  yield `[EBURON] Estimated tokens: ${classification.estimatedTokens}\n\n`

  // Phase 5: Initial model selection
  const currentModel = selectModel(classification.tags, classification.estimatedTokens, policy, telemetry)
  yield `[EBURON] Selected initial model: ${currentModel.displayName}\n\n`

  const session: ManusSession = {
    sessionId,
    task,
    policy,
    telemetry,
    currentModel,
    currentStep: 0,
    workingContext: task,
    iterations: 0,
  }

  // Phase 6: Planner turn
  yield `[EBURON] === PLANNER TURN ===\n`
  const plan = await executePlanner(session)
  session.plan = plan
  yield `[EBURON] Plan created with ${plan.steps.length} steps\n`
  for (const step of plan.steps) {
    yield `  - ${step.id}: ${step.description}\n`
  }
  yield `\n`

  // Phase 6: Main loop
  while (session.currentStep < plan.steps.length && session.iterations < policy.maxIterations) {
    session.iterations++
    const step = plan.steps[session.currentStep]

    yield `[EBURON] === ITERATION ${session.iterations} - STEP ${session.currentStep + 1}/${plan.steps.length} ===\n`
    yield `[EBURON] Executing: ${step.description}\n\n`

    // Check for model swap before execution
    const swapDecision = shouldSwapModel(session, step)
    if (swapDecision) {
      yield `[EBURON] 🔄 Swapping model: ${swapDecision.reason}\n`
      yield `[EBURON] From: ${session.currentModel.displayName} → To: ${swapDecision.to}\n\n`

      const newModel = selectModel(step.tags, classification.estimatedTokens, policy, telemetry)
      session.currentModel = newModel

      telemetry.logTurn({
        sessionId,
        iteration: session.iterations,
        role: "doer",
        modelName: session.currentModel.name,
        latencyMs: 0,
        success: true,
        swapDecision: {
          from: swapDecision.from,
          to: swapDecision.to,
          reason: swapDecision.reason,
          trigger: swapDecision.trigger,
        },
        timestamp: new Date(),
      })
    }

    // Doer turn
    yield `[EBURON] Doer (${session.currentModel.displayName})...\n`
    const doerOutput = await executeDoer(session, step)
    yield `[EBURON] ✓ ${doerOutput.changeSummary}\n`
    yield `[EBURON] Files changed: ${doerOutput.diagnostics.filesChanged}\n\n`

    // Reviewer turn
    yield `[EBURON] Reviewer...\n`
    const reviewerOutput = await executeReviewer(session, step, doerOutput)
    yield `[EBURON] Verdict: ${reviewerOutput.verdict.toUpperCase()}\n`

    if (reviewerOutput.flags.length > 0) {
      yield `[EBURON] Flags: ${reviewerOutput.flags.join(", ")}\n`
    }

    if (reviewerOutput.advice) {
      yield `[EBURON] Advice: ${reviewerOutput.advice}\n`
    }

    yield `\n`

    // Phase 8: Stop conditions
    if (reviewerOutput.verdict === "pass" && reviewerOutput.progressChars >= policy.minDeltaChars) {
      yield `[EBURON] ✅ Step completed successfully with meaningful progress\n`
      session.currentStep++

      if (session.currentStep >= plan.steps.length) {
        yield `[EBURON] 🎉 All steps completed!\n`
        break
      }
    } else {
      // Apply reviewer advice to context
      session.workingContext += `\n\nReviewer feedback: ${reviewerOutput.advice}`

      // Check for escalation flags
      const needsEscalation = reviewerOutput.flags.some((flag) => policy.reviewerFlagsForEscalation.includes(flag))

      if (needsEscalation) {
        yield `[EBURON] ⚠️ Critical flags detected, escalating...\n`
        // Force reselection with higher quality bias
        const escalatedPolicy = { ...policy }
        escalatedPolicy.biasPreference.quality = 1.0
        session.currentModel = selectModel(step.tags, classification.estimatedTokens, escalatedPolicy, telemetry)
        yield `[EBURON] Escalated to: ${session.currentModel.displayName}\n\n`
      }
    }
  }

  // Final summary
  const summary = telemetry.getSessionSummary(sessionId)
  yield `\n[EBURON] === SESSION SUMMARY ===\n`
  yield `Total turns: ${summary.totalTurns}\n`
  yield `Model swaps: ${summary.totalSwaps}\n`
  yield `Average latency: ${summary.averageLatency.toFixed(0)}ms\n`
  yield `Success rate: ${(summary.successRate * 100).toFixed(1)}%\n`
}

async function executePlanner(session: ManusSession): Promise<PlannerOutput> {
  const startTime = Date.now()

  try {
    const prompt = PLANNER_PROMPT.replace("{{TASK}}", session.task)

    const providerConfig = createOllamaCloud()(session.currentModel.name)
    const ollama = createOllama({
      baseURL: providerConfig.baseURL,
      headers: providerConfig.apiKey ? { Authorization: `Bearer ${providerConfig.apiKey}` } : undefined,
    })
    const model = ollama(providerConfig.modelId)

    const { textStream } = await streamText({
      model,
      prompt,
      temperature: 0.3,
    })

    let fullResponse = ""
    for await (const chunk of textStream) {
      fullResponse += chunk
    }

    const latency = Date.now() - startTime

    // Parse JSON response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid planner output: no JSON found")
    }

    const output: PlannerOutput = JSON.parse(jsonMatch[0])

    session.telemetry.logTurn({
      sessionId: session.sessionId,
      iteration: 0,
      role: "planner",
      modelName: session.currentModel.name,
      latencyMs: latency,
      success: true,
      timestamp: new Date(),
    })

    return output
  } catch (error) {
    const latency = Date.now() - startTime

    session.telemetry.logTurn({
      sessionId: session.sessionId,
      iteration: 0,
      role: "planner",
      modelName: session.currentModel.name,
      latencyMs: latency,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    })

    throw error
  }
}

async function executeDoer(session: ManusSession, step: PlanStep): Promise<DoerOutput> {
  const startTime = Date.now()

  try {
    const prompt = DOER_PROMPT.replace("{{STEP}}", JSON.stringify(step, null, 2)).replace(
      "{{CONTEXT}}",
      session.workingContext,
    )

    const providerConfig = createOllamaCloud()(session.currentModel.name)
    const ollama = createOllama({
      baseURL: providerConfig.baseURL,
      headers: providerConfig.apiKey ? { Authorization: `Bearer ${providerConfig.apiKey}` } : undefined,
    })
    const model = ollama(providerConfig.modelId)

    const { textStream } = await streamText({
      model,
      prompt,
      temperature: 0.1,
    })

    let fullResponse = ""
    for await (const chunk of textStream) {
      fullResponse += chunk
    }

    const latency = Date.now() - startTime

    // Parse JSON response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid doer output: no JSON found")
    }

    const output: DoerOutput = JSON.parse(jsonMatch[0])

    session.telemetry.logTurn({
      sessionId: session.sessionId,
      iteration: session.iterations,
      role: "doer",
      modelName: session.currentModel.name,
      latencyMs: latency,
      success: true,
      timestamp: new Date(),
    })

    return output
  } catch (error) {
    const latency = Date.now() - startTime

    session.telemetry.logTurn({
      sessionId: session.sessionId,
      iteration: session.iterations,
      role: "doer",
      modelName: session.currentModel.name,
      latencyMs: latency,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    })

    throw error
  }
}

async function executeReviewer(session: ManusSession, step: PlanStep, doerOutput: DoerOutput): Promise<ReviewerOutput> {
  const startTime = Date.now()

  try {
    const prompt = REVIEWER_PROMPT.replace("{{STEP}}", JSON.stringify(step, null, 2)).replace(
      "{{DOER_OUTPUT}}",
      JSON.stringify(doerOutput, null, 2),
    )

    const providerConfig = createOllamaCloud()(session.currentModel.name)
    const ollama = createOllama({
      baseURL: providerConfig.baseURL,
      headers: providerConfig.apiKey ? { Authorization: `Bearer ${providerConfig.apiKey}` } : undefined,
    })
    const model = ollama(providerConfig.modelId)

    const { textStream } = await streamText({
      model,
      prompt,
      temperature: 0.2,
    })

    let fullResponse = ""
    for await (const chunk of textStream) {
      fullResponse += chunk
    }

    const latency = Date.now() - startTime

    // Parse JSON response
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Invalid reviewer output: no JSON found")
    }

    const output: ReviewerOutput = JSON.parse(jsonMatch[0])

    session.telemetry.logTurn({
      sessionId: session.sessionId,
      iteration: session.iterations,
      role: "reviewer",
      modelName: session.currentModel.name,
      latencyMs: latency,
      success: true,
      reviewerVerdict: output.verdict,
      reviewerFlags: output.flags,
      timestamp: new Date(),
    })

    return output
  } catch (error) {
    const latency = Date.now() - startTime

    session.telemetry.logTurn({
      sessionId: session.sessionId,
      iteration: session.iterations,
      role: "reviewer",
      modelName: session.currentModel.name,
      latencyMs: latency,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    })

    throw error
  }
}

// Phase 7: Swap decision logic
function shouldSwapModel(
  session: ManusSession,
  step: PlanStep,
): { from: string; to: string; reason: SwapReason; trigger: string } | null {
  const stats = session.telemetry.getModelStats(session.currentModel.name)

  // A) Task mismatch
  const taskFit = step.tags.filter((tag) => session.currentModel.tags.includes(tag)).length / step.tags.length
  if (taskFit < 0.5) {
    return {
      from: session.currentModel.name,
      to: "TBD",
      reason: "task_mismatch",
      trigger: `Task requires ${step.tags.join(", ")} but model only covers ${taskFit * 100}%`,
    }
  }

  // B) Context pressure
  const classification = classifyTask(session.workingContext)
  const contextUtilization = classification.estimatedTokens / session.currentModel.maxContextTokens
  if (contextUtilization > session.policy.contextPressureThreshold) {
    return {
      from: session.currentModel.name,
      to: "TBD",
      reason: "context_pressure",
      trigger: `Context utilization ${(contextUtilization * 100).toFixed(1)}% exceeds threshold`,
    }
  }

  // C) Performance issues
  if (stats && stats.callCount > 0) {
    const avgLatency = stats.totalLatency / stats.callCount
    if (avgLatency > session.policy.latencyMsThreshold) {
      return {
        from: session.currentModel.name,
        to: "TBD",
        reason: "high_latency",
        trigger: `Average latency ${avgLatency.toFixed(0)}ms exceeds threshold`,
      }
    }

    if (stats.errorCount >= session.policy.consecutiveErrorsThreshold) {
      return {
        from: session.currentModel.name,
        to: "TBD",
        reason: "transport_error",
        trigger: `${stats.errorCount} consecutive errors`,
      }
    }
  }

  return null
}
