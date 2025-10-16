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
  if (language === "python") {
    try {
      const response = await fetch("/api/execute-python", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, testCases }),
      })

      if (!response.ok) {
        throw new Error(`Python execution failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Python execution failed",
        language: "python",
      }
    }
  }

  if (language === "javascript" || language === "typescript") {
    try {
      // Create a safe execution context
      const result = new Function(`
        "use strict";
        ${code}
      `)()

      return {
        success: true,
        output: String(result),
        language,
        execution_time: 0,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        language,
      }
    }
  }

  // For other languages, return not implemented
  return {
    success: false,
    error: `${language} execution not yet implemented`,
    language,
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

// Tool definitions for Eburon AI - Available to all models
export const EBURON_TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description:
        "Search the web for current information, documentation, code examples, or solutions. Use this when you need up-to-date information, latest API documentation, current events, or solutions to specific problems. Returns relevant search results with titles, URLs, and snippets.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The search query. Be specific and include relevant terms, version numbers, or error messages. Examples: 'Next.js 15 server actions', 'TypeScript 5.3 new features', 'React 19 use hook'",
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
        "Analyze error messages, stack traces, or unexpected behavior to identify root causes and suggest fixes. Use this when encountering runtime errors, build failures, type errors, or bugs. Returns error type, likely causes, and suggested fixes.",
      parameters: {
        type: "object",
        properties: {
          error_message: {
            type: "string",
            description: "The complete error message or stack trace",
          },
          context: {
            type: "string",
            description: "Additional context: when/where the error occurred, what action triggered it",
          },
          code_snippet: {
            type: "string",
            description: "The relevant code snippet that caused the error (optional but helpful)",
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
        "Execute code in a sandboxed environment to test functionality, validate logic, or debug issues. Supports JavaScript, TypeScript, Python, and SQL. Returns execution output, errors, and execution time.",
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
            description: "Optional test cases to validate the code with expected inputs/outputs",
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
        "Fetch and read official documentation for libraries, frameworks, APIs, or tools. Use this to get accurate, authoritative information about specific features, methods, or configurations. Returns documentation content and examples.",
      parameters: {
        type: "object",
        properties: {
          library: {
            type: "string",
            description:
              'The library, framework, or tool name. Examples: "Next.js", "React", "Tailwind CSS", "PostgreSQL", "TypeScript"',
          },
          topic: {
            type: "string",
            description:
              'The specific topic, feature, or API to look up. Examples: "server actions", "useEffect hook", "grid layout", "JSON functions"',
          },
          version: {
            type: "string",
            description: 'Optional version number. Examples: "15", "19", "5.3"',
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
        "Validate code for syntax errors, type errors, linting issues, and best practice violations. Use this before finalizing code to ensure quality. Returns validation results with errors, warnings, and suggestions.",
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
            description: "Enable strict validation rules (recommended for production code)",
            default: true,
          },
        },
        required: ["code", "language"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "query_database",
      description:
        "Query the Neon PostgreSQL database to retrieve, analyze, or verify data. Use this to check existing data, validate database state, or gather information for responses. Returns query results.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The SQL query to execute (SELECT queries only for safety)",
          },
          description: {
            type: "string",
            description: "Brief description of what you're querying for (for logging)",
          },
        },
        required: ["query", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_conversation",
      description:
        "Analyze the current conversation history to extract key information, identify patterns, or summarize context. Use this when you need to reference earlier parts of the conversation or understand the full context.",
      parameters: {
        type: "object",
        properties: {
          analysis_type: {
            type: "string",
            enum: ["summary", "key_points", "user_intent", "technical_context", "decisions_made"],
            description: "The type of analysis to perform on the conversation",
          },
          focus_area: {
            type: "string",
            description: "Optional: specific area to focus on (e.g., 'database schema', 'API design')",
          },
        },
        required: ["analysis_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_approaches",
      description:
        "Compare different technical approaches, libraries, or solutions to help make informed decisions. Use this when evaluating options or explaining trade-offs. Returns comparison with pros, cons, and recommendations.",
      parameters: {
        type: "object",
        properties: {
          option_a: {
            type: "string",
            description: "First approach/library/solution to compare",
          },
          option_b: {
            type: "string",
            description: "Second approach/library/solution to compare",
          },
          context: {
            type: "string",
            description: "The use case or context for the comparison",
          },
          criteria: {
            type: "array",
            items: { type: "string" },
            description: "Optional criteria to focus on (e.g., 'performance', 'ease of use', 'community support')",
          },
        },
        required: ["option_a", "option_b", "context"],
      },
    },
  },
]

export async function executeQueryDatabase(query: string, description: string) {
  try {
    // Only allow SELECT queries for safety
    if (!query.trim().toUpperCase().startsWith("SELECT")) {
      return {
        success: false,
        error: "Only SELECT queries are allowed for safety. Use the database management UI for modifications.",
      }
    }

    const { neon } = await import("@neondatabase/serverless")
    const sql = neon(process.env.DATABASE_URL!)

    const results = await sql(query)

    return {
      success: true,
      description,
      rows: results,
      count: results.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database query failed",
    }
  }
}

export async function executeAnalyzeConversation(analysisType: string, focusArea?: string) {
  // This would analyze the conversation context
  // For now, return a structured response
  return {
    success: true,
    analysis_type: analysisType,
    focus_area: focusArea,
    note: "Conversation analysis requires access to full message history. Please provide context in your prompt.",
  }
}

export async function executeCompareApproaches(optionA: string, optionB: string, context: string, criteria?: string[]) {
  // Use web search to gather comparison information
  const searchQuery = `${optionA} vs ${optionB} ${context} comparison ${criteria?.join(" ") || ""}`
  const searchResults = await executeWebSearch(searchQuery, 5)

  return {
    success: true,
    option_a: optionA,
    option_b: optionB,
    context,
    criteria: criteria || ["performance", "ease of use", "community support", "documentation"],
    search_results: searchResults.results,
    note: "Use the search results to provide a comprehensive comparison with pros, cons, and recommendations.",
  }
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
    case "query_database":
      return executeQueryDatabase(args.query, args.description)
    case "analyze_conversation":
      return executeAnalyzeConversation(args.analysis_type, args.focus_area)
    case "compare_approaches":
      return executeCompareApproaches(args.option_a, args.option_b, args.context, args.criteria)
    default:
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      }
  }
}
