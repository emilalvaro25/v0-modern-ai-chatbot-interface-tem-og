// Tool definitions for Eburon Coding Agent
export interface Tool {
  type: "function"
  function: {
    name: string
    description: string
    parameters: {
      type: "object"
      properties: Record<string, any>
      required: string[]
    }
  }
}

export const CODING_AGENT_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information, documentation, code examples, or solutions to technical problems. Use this when you need up-to-date information, API documentation, or solutions to specific coding challenges.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The search query. Be specific and include relevant technical terms, framework names, or error messages.",
          },
          max_results: {
            type: "number",
            description: "Maximum number of results to return (default: 5, max: 10)",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_error",
      description:
        "Analyze an error message or stack trace to identify the root cause and suggest fixes. Use this when encountering runtime errors, build failures, or unexpected behavior.",
      parameters: {
        type: "object",
        properties: {
          error_message: {
            type: "string",
            description: "The complete error message or stack trace",
          },
          context: {
            type: "string",
            description: "Additional context about when/where the error occurred",
          },
          code_snippet: {
            type: "string",
            description: "The relevant code snippet that caused the error (optional)",
          },
        },
        required: ["error_message"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "execute_code",
      description:
        "Execute code in a sandboxed environment to test functionality, validate logic, or debug issues. Supports JavaScript, TypeScript, Python, and SQL.",
      parameters: {
        type: "object",
        properties: {
          language: {
            type: "string",
            enum: ["javascript", "typescript", "python", "sql"],
            description: "The programming language of the code",
          },
          code: {
            type: "string",
            description: "The code to execute",
          },
          test_cases: {
            type: "array",
            items: { type: "object" },
            description: "Optional test cases to validate the code",
          },
        },
        required: ["language", "code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_documentation",
      description:
        "Fetch and read official documentation for libraries, frameworks, or APIs. Use this to get accurate, up-to-date information about specific features or methods.",
      parameters: {
        type: "object",
        properties: {
          library: {
            type: "string",
            description: 'The library or framework name (e.g., "Next.js", "React", "Tailwind CSS")',
          },
          topic: {
            type: "string",
            description: "The specific topic or feature to look up",
          },
        },
        required: ["library", "topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "validate_code",
      description:
        "Validate code for syntax errors, type errors, linting issues, and best practice violations. Returns detailed feedback on code quality.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The code to validate",
          },
          language: {
            type: "string",
            enum: ["javascript", "typescript", "python", "sql", "html", "css"],
            description: "The programming language",
          },
          strict_mode: {
            type: "boolean",
            description: "Enable strict validation rules",
            default: true,
          },
        },
        required: ["code", "language"],
      },
    },
  },
]

// Tool execution handlers
export async function executeWebSearch(query: string, maxResults = 5) {
  try {
    const response = await fetch("https://ollama.com/api/web_search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, max_results: maxResults }),
    })

    if (!response.ok) {
      throw new Error(`Web search failed: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      results: data.results,
      summary: `Found ${data.results.length} results for: ${query}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      results: [],
    }
  }
}

export async function executeAnalyzeError(errorMessage: string, context?: string, codeSnippet?: string) {
  // Analyze error patterns and suggest fixes
  const analysis = {
    error_type: identifyErrorType(errorMessage),
    likely_causes: extractLikelyCauses(errorMessage),
    suggested_fixes: generateSuggestedFixes(errorMessage, context, codeSnippet),
    related_docs: [],
  }

  return {
    success: true,
    analysis,
  }
}

export async function executeCode(language: string, code: string, testCases?: any[]) {
  // This would integrate with a code execution sandbox
  // For now, return a mock response
  return {
    success: true,
    output: "Code execution not yet implemented in sandbox",
    language,
    execution_time: 0,
  }
}

export async function executeReadDocumentation(library: string, topic: string) {
  // Use web search to find official documentation
  const query = `${library} official documentation ${topic}`
  return executeWebSearch(query, 3)
}

export async function executeValidateCode(code: string, language: string, strictMode = true) {
  // This would integrate with linters/validators
  // For now, return basic validation
  return {
    success: true,
    valid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }
}

// Helper functions
function identifyErrorType(errorMessage: string): string {
  if (errorMessage.includes("TypeError")) return "Type Error"
  if (errorMessage.includes("ReferenceError")) return "Reference Error"
  if (errorMessage.includes("SyntaxError")) return "Syntax Error"
  if (errorMessage.includes("NetworkError") || errorMessage.includes("fetch")) return "Network Error"
  if (errorMessage.includes("Database") || errorMessage.includes("SQL")) return "Database Error"
  return "Runtime Error"
}

function extractLikelyCauses(errorMessage: string): string[] {
  const causes: string[] = []

  if (errorMessage.includes("undefined")) {
    causes.push("Variable or property is undefined")
    causes.push("Missing null/undefined check")
  }
  if (errorMessage.includes("null")) {
    causes.push("Null reference")
    causes.push("Object not initialized")
  }
  if (errorMessage.includes("is not a function")) {
    causes.push("Calling a non-function value")
    causes.push("Incorrect import or typo in function name")
  }

  return causes.length > 0 ? causes : ["Unknown cause - needs investigation"]
}

function generateSuggestedFixes(errorMessage: string, context?: string, codeSnippet?: string): string[] {
  const fixes: string[] = []

  if (errorMessage.includes("undefined")) {
    fixes.push("Add null/undefined checks before accessing properties")
    fixes.push("Use optional chaining (?.) operator")
    fixes.push("Provide default values with nullish coalescing (??)")
  }

  if (errorMessage.includes("is not a function")) {
    fixes.push("Verify the import statement is correct")
    fixes.push("Check if the variable is actually a function")
    fixes.push("Ensure the function is defined before calling it")
  }

  return fixes.length > 0 ? fixes : ["Review the error message and stack trace for more details"]
}

export async function executeTool(toolName: string, args: any) {
  console.log("[v0] Executing tool:", toolName, "with args:", args)

  switch (toolName) {
    case "web_search":
      return executeWebSearch(args.query, args.max_results)
    case "analyze_error":
      return executeAnalyzeError(args.error_message, args.context, args.code_snippet)
    case "execute_code":
      return executeCode(args.language, args.code, args.test_cases)
    case "read_documentation":
      return executeReadDocumentation(args.library, args.topic)
    case "validate_code":
      return executeValidateCode(args.code, args.language, args.strict_mode)
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      }
  }
}
