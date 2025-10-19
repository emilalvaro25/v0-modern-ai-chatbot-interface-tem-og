import { buildAIMemory } from "./memory"
import { executeTool } from "./tools"
import { appendFile, readFile } from "fs/promises"
import { join } from "path"

// Agent state management
export interface AgentState {
  conversationId: string
  userId: string
  currentTask?: string
  taskHistory: TaskRecord[]
  context: Map<string, any>
  memory: any
  toolResults: Map<string, any>
}

export interface TaskRecord {
  id: string
  name: string
  status: "pending" | "in-progress" | "completed" | "failed"
  startTime?: Date
  endTime?: Date
  steps: StepRecord[]
  result?: any
  error?: string
}

export interface StepRecord {
  action: string
  tool?: string
  input?: any
  output?: any
  timestamp: Date
  success: boolean
}

// Orchestrator class - the "brain" of the agent
export class AgentOrchestrator {
  private state: AgentState
  private taskManagerPath: string

  constructor(conversationId: string, userId: string) {
    this.state = {
      conversationId,
      userId,
      taskHistory: [],
      context: new Map(),
      memory: null,
      toolResults: new Map(),
    }
    this.taskManagerPath = join(process.cwd(), "TaskManager.md")
  }

  // Initialize agent with full context
  async initialize() {
    this.state.memory = await buildAIMemory(this.state.userId, this.state.conversationId)

    await this.loadTaskHistory()

    this.buildContextMap()

    return this.state
  }

  // Load task history from TaskManager.md
  private async loadTaskHistory() {
    try {
      const content = await readFile(this.taskManagerPath, "utf-8")
      const tasks = this.parseTaskManager(content)
      this.state.context.set("previousTasks", tasks)
    } catch (error) {
      // File doesn't exist yet, that's okay
      this.state.context.set("previousTasks", [])
    }
  }

  // Parse TaskManager.md to extract task records
  private parseTaskManager(content: string): any[] {
    const tasks: any[] = []
    const taskBlocks = content.split("[TASK START]").slice(1)

    for (const block of taskBlocks) {
      const lines = block.split("\n")
      const task: any = {}

      for (const line of lines) {
        if (line.startsWith("Task:")) task.name = line.replace("Task:", "").trim()
        if (line.startsWith("Start Time:")) task.startTime = line.replace("Start Time:", "").trim()
        if (line.startsWith("End Time:")) task.endTime = line.replace("End Time:", "").trim()
        if (line.startsWith("Summary:")) task.summary = line.replace("Summary:", "").trim()
        if (line.startsWith("Issues:")) task.issues = line.replace("Issues:", "").trim()
      }

      if (task.name) tasks.push(task)
    }

    return tasks
  }

  private buildContextMap() {
    if (!this.state.memory) return

    const { recentMessages, conversationHistory } = this.state.memory

    this.state.context.set("messageCount", recentMessages.length)
    this.state.context.set("conversationCount", conversationHistory.length)

    const topics = this.extractTopics(recentMessages)
    this.state.context.set("topics", topics)

    const preferences = this.extractPreferences(recentMessages)
    this.state.context.set("preferences", preferences)
  }

  // Extract topics from messages
  private extractTopics(messages: any[]): string[] {
    const topics = new Set<string>()
    const keywords = ["database", "api", "ui", "component", "error", "bug", "feature", "deploy"]

    for (const msg of messages) {
      const content = msg.content.toLowerCase()
      for (const keyword of keywords) {
        if (content.includes(keyword)) topics.add(keyword)
      }
    }

    return Array.from(topics)
  }

  // Extract user preferences
  private extractPreferences(messages: any[]): any {
    return {
      verbosity: messages.some((m) => m.content.includes("explain") || m.content.includes("detail"))
        ? "high"
        : "medium",
      codeStyle: messages.some((m) => m.content.includes("typescript")) ? "typescript" : "javascript",
      framework: messages.some((m) => m.content.includes("next")) ? "nextjs" : "react",
    }
  }

  // Start a new task with intelligent planning
  async startTask(taskName: string, description: string) {
    const task: TaskRecord = {
      id: `task-${Date.now()}`,
      name: taskName,
      status: "in-progress",
      startTime: new Date(),
      steps: [],
    }

    this.state.currentTask = task.id
    this.state.taskHistory.push(task)

    await this.logTaskStart(task, description)

    return task
  }

  // Execute a step with tool orchestration
  async executeStep(action: string, toolName?: string, input?: any): Promise<any> {
    const step: StepRecord = {
      action,
      tool: toolName,
      input,
      timestamp: new Date(),
      success: false,
    }

    try {
      let result: any

      if (toolName) {
        result = await executeTool(toolName, input)
        this.state.toolResults.set(toolName, result)
      }

      step.output = result
      step.success = true

      const currentTask = this.getCurrentTask()
      if (currentTask) {
        currentTask.steps.push(step)
      }

      return result
    } catch (error) {
      step.success = false
      step.output = { error: error instanceof Error ? error.message : String(error) }

      const currentTask = this.getCurrentTask()
      if (currentTask) {
        currentTask.steps.push(step)
      }

      throw error
    }
  }

  // Complete current task
  async completeTask(summary: string, issues?: string) {
    const task = this.getCurrentTask()
    if (!task) return

    task.status = "completed"
    task.endTime = new Date()
    task.result = summary

    await this.logTaskEnd(task, summary, issues)

    this.state.currentTask = undefined
  }

  // Fail current task
  async failTask(error: string) {
    const task = this.getCurrentTask()
    if (!task) return

    task.status = "failed"
    task.endTime = new Date()
    task.error = error

    await this.logTaskEnd(task, `Failed: ${error}`, error)

    this.state.currentTask = undefined
  }

  // Get current task
  private getCurrentTask(): TaskRecord | undefined {
    return this.state.taskHistory.find((t) => t.id === this.state.currentTask)
  }

  // Log task start to TaskManager.md
  private async logTaskStart(task: TaskRecord, description: string) {
    const log = `
[TASK START]
Task: ${task.name}
Start Time: ${task.startTime?.toISOString()}
Description: ${description}
Prep: Initialized with full context and memory

------------------------------------------------------------
`
    await appendFile(this.taskManagerPath, log)
  }

  // Log task end to TaskManager.md
  private async logTaskEnd(task: TaskRecord, summary: string, issues?: string) {
    const log = `
[TASK END]
Task: ${task.name}
End Time: ${task.endTime?.toISOString()}
Summary: ${summary}
Issues: ${issues || "None"}

------------------------------------------------------------
`
    await appendFile(this.taskManagerPath, log)
  }

  // Get intelligent context summary for AI
  getContextSummary(): string {
    const topics = this.state.context.get("topics") || []
    const preferences = this.state.context.get("preferences") || {}
    const previousTasks = this.state.context.get("previousTasks") || []

    let summary = "\n## AGENT ORCHESTRATION CONTEXT\n\n"

    if (previousTasks.length > 0) {
      summary += "### Recent Tasks:\n"
      previousTasks.slice(-5).forEach((task: any) => {
        summary += `- ${task.name} (${task.endTime || "in progress"})\n`
      })
      summary += "\n"
    }

    if (topics.length > 0) {
      summary += `### Active Topics: ${topics.join(", ")}\n\n`
    }

    summary += `### User Preferences:\n`
    summary += `- Verbosity: ${preferences.verbosity || "medium"}\n`
    summary += `- Code Style: ${preferences.codeStyle || "typescript"}\n`
    summary += `- Framework: ${preferences.framework || "react"}\n\n`

    if (this.state.currentTask) {
      const task = this.getCurrentTask()
      if (task) {
        summary += `### Current Task: ${task.name}\n`
        summary += `- Status: ${task.status}\n`
        summary += `- Steps completed: ${task.steps.length}\n\n`
      }
    }

    return summary
  }

  // Get full state for debugging
  getState(): AgentState {
    return this.state
  }
}

// Factory function to create orchestrator
export async function createOrchestrator(conversationId: string, userId: string): Promise<AgentOrchestrator> {
  const orchestrator = new AgentOrchestrator(conversationId, userId)
  await orchestrator.initialize()
  return orchestrator
}
