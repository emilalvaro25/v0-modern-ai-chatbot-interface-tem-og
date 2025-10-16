export const API_CONFIG = {
  // Primary endpoint (Cloud API)
  primary: {
    baseUrl: process.env.OLLAMA_CLOUD_API || "https://api.ollama.ai",
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
  AI_UNAVAILABLE: "AI service is temporarily unavailable. Please try again.",
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

  // Add auth header only if key exists (primary endpoint)
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`
  }

  try {
    console.log(`[System] Calling ${usePrimary ? "primary" : "fallback"} endpoint...`)

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    })

    // If primary fails, try fallback
    if (!response.ok && usePrimary) {
      console.log("[System] Primary endpoint failed, trying fallback...")
      return callOllamaAPI(requestBody, false)
    }

    return response
  } catch (error) {
    // Network error on primary, try fallback
    if (usePrimary) {
      console.log("[System] Primary endpoint unreachable, using fallback...")
      return callOllamaAPI(requestBody, false)
    }
    throw error
  }
}
