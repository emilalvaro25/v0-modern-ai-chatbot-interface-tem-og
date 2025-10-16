export const API_CONFIG = {
  // Primary endpoint (Cloud API)
  primary: {
    baseUrl: process.env.OLLAMA_CLOUD_API || "https://ollama.com",
    apiKey: process.env.OLLAMA_API_KEY || "",
  },
  // Fallback endpoint (Self-hosted VPS)
  fallback: {
    baseUrl: "http://168.231.78.113:11434",
    apiKey: "", // No key needed for self-hosted
  },
}

// Generic error messages that don't expose technical details
export const ERROR_MESSAGES = {
  AI_UNAVAILABLE: "I'm having trouble connecting to the Emilio Server. Please try again.",
  NETWORK_ERROR: "Unable to connect. Please check your connection and try again.",
  RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  GENERIC: "Something went wrong. Please try again.",
  TIMEOUT: "Request timed out. Please try again.",
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
  console.log("[v0] Using endpoint:", usePrimary ? "primary" : "fallback")
  console.log("[v0] URL:", url)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response ok:", response.ok)

    // If primary fails, try fallback
    if (!response.ok && usePrimary) {
      console.log("[v0] Primary endpoint failed, trying fallback...")
      return callOllamaAPI(requestBody, false)
    }

    if (!response.ok) {
      console.error("[v0] Both endpoints failed")
      const errorText = await response.text().catch(() => "Unable to read error")
      console.error("[v0] Error details:", errorText)
    }

    return response
  } catch (error) {
    console.error("[v0] Network error:", error instanceof Error ? error.message : "Unknown error")
    // Network error on primary, try fallback
    if (usePrimary) {
      console.log("[v0] Trying fallback after network error...")
      try {
        return await callOllamaAPI(requestBody, false)
      } catch (fallbackError) {
        console.error("[v0] Fallback also failed:", fallbackError)
        throw error // Throw original error
      }
    }
    throw error
  }
}
