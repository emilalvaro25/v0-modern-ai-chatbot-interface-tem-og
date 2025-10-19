import { type NextRequest, NextResponse } from "next/server"
import { createOrchestrator } from "@/lib/orchestrator"
import { createAgentBrain } from "@/lib/agent-brain"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { conversationId, userId, userMessage, action = "analyze" } = await req.json()

    if (!conversationId || !userId) {
      return NextResponse.json({ error: "conversationId and userId required" }, { status: 400 })
    }

    const orchestrator = await createOrchestrator(conversationId, userId)
    const brain = createAgentBrain(orchestrator)

    if (action === "analyze") {
      const decision = await brain.analyzeAndDecide(userMessage, [])
      const contextSummary = orchestrator.getContextSummary()

      return NextResponse.json({
        decision,
        context: contextSummary,
        state: orchestrator.getState(),
      })
    }

    if (action === "start_task") {
      const { taskName, description } = await req.json()
      const task = await orchestrator.startTask(taskName, description)
      const tools = await brain.selectTools(description)

      return NextResponse.json({
        task,
        recommendedTools: tools,
        context: orchestrator.getContextSummary(),
      })
    }

    if (action === "execute_step") {
      const { stepAction, tool, input } = await req.json()
      const result = await orchestrator.executeStep(stepAction, tool, input)

      return NextResponse.json({
        result,
        state: orchestrator.getState(),
      })
    }

    if (action === "complete_task") {
      const { summary, issues } = await req.json()
      await orchestrator.completeTask(summary, issues)

      return NextResponse.json({
        success: true,
        state: orchestrator.getState(),
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[Orchestrator] Error:", error)
    return NextResponse.json({ error: "Orchestration failed" }, { status: 500 })
  }
}
