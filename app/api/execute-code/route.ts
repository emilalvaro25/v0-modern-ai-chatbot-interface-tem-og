import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { language, code, testCases, timeout = 30000 } = await req.json()

    if (!language || !code) {
      return NextResponse.json({ error: "Language and code are required" }, { status: 400 })
    }

    const startTime = Date.now()

    switch (language.toLowerCase()) {
      case "python": {
        // Forward to Python execution endpoint
        const pythonResponse = await fetch(new URL("/api/execute-python", req.url).toString(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, testCases }),
        })
        return pythonResponse
      }

      case "javascript":
      case "typescript": {
        try {
          // Create isolated execution context
          const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
          const fn = new AsyncFunction(`
            "use strict";
            ${code}
          `)

          // Execute with timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Execution timeout")), timeout),
          )
          const executionPromise = fn()

          const result = await Promise.race([executionPromise, timeoutPromise])
          const executionTime = Date.now() - startTime

          return NextResponse.json({
            success: true,
            output: String(result),
            result: result,
            language,
            execution_time: executionTime,
          })
        } catch (error) {
          const executionTime = Date.now() - startTime
          return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Execution failed",
            language,
            execution_time: executionTime,
          })
        }
      }

      case "sql": {
        // SQL execution requires database connection
        return NextResponse.json({
          success: false,
          error: "SQL execution requires database connection. Use the query_database tool instead.",
          language: "sql",
        })
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Language '${language}' is not supported. Supported languages: python, javascript, typescript, sql`,
          },
          { status: 400 },
        )
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Code execution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
