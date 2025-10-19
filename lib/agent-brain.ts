import type { AgentOrchestrator } from "./orchestrator"

export interface Decision {
  action: "use_tool" | "respond" | "ask_clarification" | "plan_task"
  reasoning: string
  tool?: string
  input?: any
  confidence: number
}

// Agent Brain - makes intelligent decisions based on context
export class AgentBrain {
  private orchestrator: AgentOrchestrator

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator
  }

  // Analyze user message and decide next action
  async analyzeAndDecide(userMessage: string, conversationHistory: any[]): Promise<Decision> {
    const state = this.orchestrator.getState()
    const context = this.orchestrator.getContextSummary()

    const patterns = {
      needsSearch: /how to|what is|explain|documentation|latest|current/i,
      needsCode: /write|create|build|implement|code|function/i,
      needsDebug: /error|bug|not working|broken|fix|issue/i,
      needsDatabase: /database|query|sql|table|data/i,
      needsComparison: /vs|versus|compare|which is better|difference/i,
      needsClarification: /what do you mean|unclear|not sure|can you|could you/i,
    }

    if (patterns.needsDebug.test(userMessage)) {
      return {
        action: "use_tool",
        reasoning: "User is reporting an error or bug. Using analyze_error tool to diagnose.",
        tool: "analyze_error",
        input: { error_message: userMessage },
        confidence: 0.9,
      }
    }

    if (patterns.needsSearch.test(userMessage)) {
      return {
        action: "use_tool",
        reasoning: "User needs current information or documentation. Using web_search tool.",
        tool: "web_search",
        input: { query: userMessage },
        confidence: 0.85,
      }
    }

    if (patterns.needsDatabase.test(userMessage)) {
      return {
        action: "use_tool",
        reasoning: "User is asking about database. Using query_database tool to check schema/data.",
        tool: "query_database",
        input: { query: "SELECT * FROM information_schema.tables LIMIT 10" },
        confidence: 0.8,
      }
    }

    if (patterns.needsComparison.test(userMessage)) {
      return {
        action: "use_tool",
        reasoning: "User wants to compare options. Using compare_approaches tool.",
        tool: "compare_approaches",
        confidence: 0.75,
      }
    }

    if (patterns.needsClarification.test(userMessage)) {
      return {
        action: "ask_clarification",
        reasoning: "User's request is unclear. Need more information before proceeding.",
        confidence: 0.7,
      }
    }

    if (patterns.needsCode.test(userMessage)) {
      return {
        action: "plan_task",
        reasoning: "User wants code implementation. Should create a plan first.",
        confidence: 0.85,
      }
    }

    return {
      action: "respond",
      reasoning: "Standard response with full context awareness.",
      confidence: 0.6,
    }
  }

  // Determine which tools to use for a task
  async selectTools(taskDescription: string): Promise<string[]> {
    const tools: string[] = []

    if (taskDescription.toLowerCase().includes("search") || taskDescription.toLowerCase().includes("find")) {
      tools.push("web_search")
    }

    if (taskDescription.toLowerCase().includes("error") || taskDescription.toLowerCase().includes("debug")) {
      tools.push("analyze_error")
    }

    if (taskDescription.toLowerCase().includes("code") || taskDescription.toLowerCase().includes("implement")) {
      tools.push("execute_code", "validate_code")
    }

    if (taskDescription.toLowerCase().includes("database") || taskDescription.toLowerCase().includes("query")) {
      tools.push("query_database")
    }

    if (taskDescription.toLowerCase().includes("compare") || taskDescription.toLowerCase().includes("vs")) {
      tools.push("compare_approaches")
    }

    tools.push("analyze_conversation")

    return tools
  }

  // Evaluate if task is complete
  async evaluateCompletion(task: any, expectedOutcome: string): Promise<boolean> {
    const allStepsSucceeded = task.steps.every((step: any) => step.success)

    if (!allStepsSucceeded) return false

    const hasResults = task.steps.some((step: any) => step.output && Object.keys(step.output).length > 0)

    return hasResults
  }

  // Generate next steps based on current state
  async generateNextSteps(currentTask: any): Promise<string[]> {
    const steps: string[] = []

    if (!currentTask) {
      return ["Analyze user request", "Create execution plan", "Begin implementation"]
    }

    const completedSteps = currentTask.steps.filter((s: any) => s.success).length
    const totalSteps = currentTask.steps.length

    if (completedSteps === 0) {
      steps.push("Gather context and requirements")
      steps.push("Search for relevant documentation")
    } else if (completedSteps < totalSteps / 2) {
      steps.push("Continue implementation")
      steps.push("Test current progress")
    } else {
      steps.push("Finalize implementation")
      steps.push("Validate and test")
      steps.push("Document changes")
    }

    return steps
  }
}

// Factory function
export function createAgentBrain(orchestrator: AgentOrchestrator): AgentBrain {
  return new AgentBrain(orchestrator)
}
