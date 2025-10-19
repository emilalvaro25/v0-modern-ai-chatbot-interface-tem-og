import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { code, testCases } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 })
    }

    // Load Pyodide dynamically
    const pyodideModule = await import("pyodide")
    const pyodide = await pyodideModule.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
    })

    // Install commonly used packages
    await pyodide.loadPackage(["numpy", "pandas", "matplotlib"])

    // Capture stdout
    let output = ""
    pyodide.setStdout({
      batched: (text: string) => {
        output += text + "\n"
      },
    })

    const startTime = Date.now()

    try {
      // Execute the Python code
      const result = await pyodide.runPythonAsync(code)
      const executionTime = Date.now() - startTime

      // Run test cases if provided
      let testResults = null
      if (testCases && testCases.length > 0) {
        testResults = []
        for (const testCase of testCases) {
          try {
            const testResult = await pyodide.runPythonAsync(testCase.code)
            testResults.push({
              passed: testResult === testCase.expected,
              actual: testResult,
              expected: testCase.expected,
            })
          } catch (error) {
            testResults.push({
              passed: false,
              error: error instanceof Error ? error.message : "Test execution failed",
            })
          }
        }
      }

      return NextResponse.json({
        success: true,
        output: output || String(result),
        result: result,
        language: "python",
        execution_time: executionTime,
        test_results: testResults,
      })
    } catch (error) {
      const executionTime = Date.now() - startTime
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : "Python execution failed",
        output: output,
        language: "python",
        execution_time: executionTime,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize Python sandbox",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
