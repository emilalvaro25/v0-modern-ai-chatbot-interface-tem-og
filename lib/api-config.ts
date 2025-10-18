export const API_CONFIG = {
  // Primary endpoint (Cloud API)
  primary: {
    baseUrl: process.env.OLLAMA_CLOUD_API || "https://ollama.com",
    apiKey: process.env.EMILIOAI_API_KEY || process.env.OLLAMA_API_KEY || "",
  },
  // Fallback endpoint (Self-hosted VPS)
  fallback: {
    baseUrl: "http://168.231.78.113:11434",
    apiKey: "", // No key needed for self-hosted
  },
}

export const ERROR_MESSAGES = {
  AI_UNAVAILABLE: "Please check your EMILIOAI_API_KEY by notifying Master E to check the server",
  NETWORK_ERROR: "Please check your EMILIOAI_API_KEY by notifying Master E to check the server",
  RATE_LIMIT: "Please check your EMILIOAI_API_KEY by notifying Master E to check the server",
  GENERIC: "Please check your EMILIOAI_API_KEY by notifying Master E to check the server",
  TIMEOUT: "Please check your EMILIOAI_API_KEY by notifying Master E to check the server",
}

export async function callOllamaAPI(requestBody: any, usePrimary = true): Promise<Response> {
  const config = usePrimary ? API_CONFIG.primary : API_CONFIG.fallback
  const url = `${config.baseUrl}/api/chat`

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (config.apiKey && config.apiKey.trim() !== "") {
    headers["Authorization"] = `Bearer ${config.apiKey}`
  }

  console.log("[v0] Attempting connection to Emilio Server...")
  console.log("[v0] Using endpoint:", usePrimary ? "primary (Ollama Cloud)" : "fallback (Self-hosted)")
  console.log("[v0] Full URL:", url)
  console.log("[v0] Has API Key:", !!config.apiKey)
  console.log("[v0] Request model:", requestBody.model)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(60000),
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response ok:", response.ok)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error")
      console.error("[v0] Error response body:", errorText)

      if (usePrimary) {
        console.log("[v0] Primary endpoint failed, trying fallback...")
        return callOllamaAPI(requestBody, false)
      }
    }

    return response
  } catch (error) {
    console.error("[v0] Network error:", error instanceof Error ? error.message : "Unknown error")
    if (usePrimary) {
      console.log("[v0] Trying fallback after network error...")
      try {
        return await callOllamaAPI(requestBody, false)
      } catch (fallbackError) {
        console.error("[v0] Fallback also failed:", fallbackError)
        throw error
      }
    }
    throw error
  }
}
