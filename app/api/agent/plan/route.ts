import { type NextRequest, NextResponse } from "next/server"

const OLLAMA_API_URL = "https://api.ollama.com/v1/chat/completions"

const PLANNING_PROMPT = `You are Eburon Planning Agent, created by Emilio AI. Your role is to analyze user requests and create detailed, actionable execution plans.

When a user provides a task, you must:

1. **Think deeply** about the request:
   - Break down the core requirements
   - Identify dependencies and prerequisites
   - Consider potential challenges
   - Determine the optimal execution order

2. **Create a structured plan** with:
   - Clear, specific tasks (3-7 tasks maximum)
   - Each task should be a distinct milestone
   - Tasks should be ordered logically
   - Avoid vague tasks like "Polish" or "Test"

3. **Estimate complexity**:
   - Provide realistic time estimates
   - Consider the scope and difficulty

**Response Format (JSON only):**
{
  "thinking": "Your detailed analysis of the request, breaking down what needs to be done and why",
  "tasks": [
    "Task 1: Specific, actionable description",
    "Task 2: Specific, actionable description",
    ...
  ],
  "estimatedTime": "X minutes/hours",
  "feasibility": "high|medium|low",
  "concerns": ["Any potential issues or requirements"]
}

**Important:**
- Be specific and actionable
- Focus on milestone-level tasks, not micro-steps
- Consider the user's technical level
- Identify missing requirements or blockers
- Return ONLY valid JSON, no markdown or extra text`

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "qwen3-coder:480b-cloud" } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.OLLAMA_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "OLLAMA_API_KEY not configured" }, { status: 500 })
    }

    // Call Ollama API to generate plan
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: PLANNING_PROMPT,
          },
          {
            role: "user",
            content: `Create an execution plan for this request:\n\n${prompt}`,
          },
        ],
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Ollama API error:", errorText)
      return NextResponse.json({ error: "Failed to generate plan" }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: "No plan generated" }, { status: 500 })
    }

    // Parse the JSON response
    try {
      // Extract JSON from markdown code blocks if present
      let jsonContent = content
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonContent = jsonMatch[1]
      }

      const plan = JSON.parse(jsonContent)

      // Validate plan structure
      if (!plan.thinking || !plan.tasks || !Array.isArray(plan.tasks)) {
        throw new Error("Invalid plan structure")
      }

      return NextResponse.json({ plan })
    } catch (parseError) {
      console.error("[v0] Failed to parse plan JSON:", parseError)
      // Return a fallback plan
      return NextResponse.json({
        plan: {
          thinking: content,
          tasks: ["Review the generated plan", "Break down into specific steps", "Execute systematically"],
          estimatedTime: "Unknown",
          feasibility: "medium",
          concerns: ["Plan format needs refinement"],
        },
      })
    }
  } catch (error) {
    console.error("[v0] Agent planning error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
