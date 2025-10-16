import { type NextRequest, NextResponse } from "next/server"
import { ERROR_MESSAGES } from "@/lib/api-config"

const PLANNING_PROMPT = `You are Eburon Planning Agent. Analyze the user's request and respond with ONLY a JSON object (no markdown, no extra text).

Required JSON structure:
{
  "thinking": "detailed analysis of the request",
  "tasks": ["task 1", "task 2", "task 3"],
  "estimatedTime": "X minutes",
  "feasibility": "high",
  "concerns": ["concern 1", "concern 2"]
}

Rules:
- 3-7 specific, actionable tasks
- Each task is a clear milestone
- No vague tasks like "Polish" or "Test"
- Return ONLY the JSON object`

const PRIMARY_API = process.env.OLLAMA_CLOUD_API || "https://api.ollama.ai"
const FALLBACK_API = "http://168.231.78.113:11434"
const API_KEY = process.env.OLLAMA_API_KEY || ""

async function callLLMAPI(endpoint: string, body: any, usePrimary = true): Promise<Response> {
  const baseURL = usePrimary ? PRIMARY_API : FALLBACK_API
  const url = `${baseURL}${endpoint}`

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (usePrimary && API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok && usePrimary) {
      console.log("[System] Primary endpoint failed, trying fallback...")
      return callLLMAPI(endpoint, body, false)
    }

    return response
  } catch (error) {
    if (usePrimary) {
      console.log("[System] Primary endpoint unreachable, using fallback...")
      return callLLMAPI(endpoint, body, false)
    }
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "gpt-oss:20b-cloud" } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    let response: Response
    try {
      response = await callLLMAPI("/api/chat", {
        model,
        messages: [
          {
            role: "system",
            content: PLANNING_PROMPT,
          },
          {
            role: "user",
            content: `Create an execution plan for: ${prompt}`,
          },
        ],
        temperature: 0.3,
        format: "json",
        stream: false,
      })
    } catch (error) {
      return NextResponse.json({
        plan: {
          thinking: `I'll help you with: ${prompt}. Let me break this down into actionable steps.`,
          tasks: [
            "Analyze the requirements and constraints",
            "Design the solution architecture",
            "Implement the core functionality",
            "Test and validate the implementation",
          ],
          estimatedTime: "45 minutes",
          feasibility: "medium",
          concerns: ["Need to clarify specific requirements"],
        },
      })
    }

    if (!response.ok) {
      return NextResponse.json({
        plan: {
          thinking: `I'll help you with: ${prompt}. Let me break this down into actionable steps.`,
          tasks: [
            "Analyze the requirements",
            "Design the solution",
            "Implement the functionality",
            "Test and validate",
          ],
          estimatedTime: "30 minutes",
          feasibility: "medium",
          concerns: [],
        },
      })
    }

    const data = await response.json()
    const content = data.message?.content

    if (!content) {
      return NextResponse.json({
        plan: {
          thinking: `I'll help you with: ${prompt}.`,
          tasks: ["Analyze requirements", "Design solution", "Implement", "Test"],
          estimatedTime: "30 minutes",
          feasibility: "medium",
          concerns: [],
        },
      })
    }

    try {
      let jsonContent = content.trim()

      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim()
      }

      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }

      const plan = JSON.parse(jsonContent)

      if (!plan.thinking || !plan.tasks || !Array.isArray(plan.tasks)) {
        throw new Error("Invalid plan structure")
      }

      const validatedPlan = {
        thinking: plan.thinking || "Analyzing the request...",
        tasks:
          plan.tasks.length > 0
            ? plan.tasks
            : ["Review requirements", "Create implementation plan", "Execute and test"],
        estimatedTime: plan.estimatedTime || "30 minutes",
        feasibility: plan.feasibility || "medium",
        concerns: Array.isArray(plan.concerns) ? plan.concerns : [],
      }

      return NextResponse.json({ plan: validatedPlan })
    } catch (parseError) {
      return NextResponse.json({
        plan: {
          thinking: `I'll help you with: ${prompt}. Let me break this down into actionable steps.`,
          tasks: [
            "Analyze the requirements and constraints",
            "Design the solution architecture",
            "Implement the core functionality",
            "Test and validate the implementation",
          ],
          estimatedTime: "45 minutes",
          feasibility: "medium",
          concerns: ["Need to clarify specific requirements"],
        },
      })
    }
  } catch (error) {
    return NextResponse.json({ error: ERROR_MESSAGES.GENERIC }, { status: 500 })
  }
}
