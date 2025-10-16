export const API_CONFIG = {
  // Primary endpoint (Cloud API)
  primary: {
    url: process.env.OLLAMA_CLOUD_API || "https://api.ollama.ai",
    key: process.env.OLLAMA_API_KEY || "",
  },
  // Fallback endpoint (Self-hosted VPS)
  fallback: {
    url: "http://168.231.78.113:11434",
    key: "", // No key needed for self-hosted
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

// Helper function to make API calls with automatic fallback
export async function fetchWithFallback(endpoint: string, options: RequestInit, usePrimary = true): Promise<Response> {
  const config = usePrimary ? API_CONFIG.primary : API_CONFIG.fallback
  const url = `${config.url}${endpoint}`

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  }

  // Add auth header only if key exists (primary endpoint)
  if (config.key) {
    headers["Authorization"] = `Bearer ${config.key}`
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    // If primary fails, try fallback
    if (!response.ok && usePrimary) {
      console.log("[System] Primary endpoint failed, trying fallback...")
      return fetchWithFallback(endpoint, options, false)
    }

    return response
  } catch (error) {
    // Network error on primary, try fallback
    if (usePrimary) {
      console.log("[System] Primary endpoint unreachable, using fallback...")
      return fetchWithFallback(endpoint, options, false)
    }
    throw error
  }
}
