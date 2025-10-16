import { type NextRequest, NextResponse } from "next/server"

const OLLAMA_API_URL = "https://api.ollama.com/v1/chat/completions"

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

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = "gpt-oss:20b-cloud" } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const apiKey = process.env.OLLAMA_API_KEY
    if (!apiKey) {
      console.error("[v0] OLLAMA_API_KEY not configured")
      return NextResponse.json({ error: "OLLAMA_API_KEY not configured" }, { status: 500 })
    }

    console.log("[v0] Generating plan for:", prompt.slice(0, 100))

    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model, // Use the faster 20b model for planning
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
        temperature: 0.3, // Lower temperature for more consistent JSON
        format: "json", // Force JSON output
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Ollama API error:", response.status, errorText)
      return NextResponse.json({ error: `Ollama API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error("[v0] No content in response:", data)
      return NextResponse.json({ error: "No plan generated" }, { status: 500 })
    }

    console.log("[v0] Raw plan response:", content.slice(0, 200))

    try {
      // Try to extract JSON from markdown code blocks first
      let jsonContent = content.trim()

      // Remove markdown code blocks if present
      const codeBlockMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch) {
        jsonContent = codeBlockMatch[1].trim()
      }

      // Remove any leading/trailing non-JSON text
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonContent = jsonMatch[0]
      }

      const plan = JSON.parse(jsonContent)

      // Validate plan structure
      if (!plan.thinking || !plan.tasks || !Array.isArray(plan.tasks)) {
        console.error("[v0] Invalid plan structure:", plan)
        throw new Error("Invalid plan structure")
      }

      // Ensure all required fields have defaults
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

      console.log("[v0] Plan generated successfully with", validatedPlan.tasks.length, "tasks")
      return NextResponse.json({ plan: validatedPlan })
    } catch (parseError) {
      console.error("[v0] Failed to parse plan JSON:", parseError)
      console.error("[v0] Content was:", content)

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
          concerns: ["Need to clarify specific requirements", "May need additional context"],
        },
      })
    }
  } catch (error) {
    console.error("[v0] Agent planning error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
