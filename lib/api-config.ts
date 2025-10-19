// Function to validate and get the base URL
function validateAndGetBaseUrl(): string {
  const envUrl = process.env.OLLAMA_CLOUD_API
  const defaultUrl = "https://ollama.com"

  // If no env var is set, use default
  if (!envUrl || envUrl.trim() === "") {
    console.log("[v0] No OLLAMA_CLOUD_API set, using default:", defaultUrl)
    return defaultUrl
  }

  // Strict validation: URL must start with http:// or https://
  const trimmedUrl = envUrl.trim()
  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    console.error("[v0] ⚠️ INVALID OLLAMA_CLOUD_API format:", trimmedUrl)
    console.error("[v0] ⚠️ URL must start with http:// or https://")
    console.error("[v0] ⚠️ Falling back to default:", defaultUrl)
    return defaultUrl
  }

  // Additional validation: ensure it's a valid URL
  try {
    new URL(trimmedUrl)
    console.log("[v0] ✓ Using OLLAMA_CLOUD_API from env:", trimmedUrl)
    return trimmedUrl
  } catch (error) {
    console.error("[v0] ⚠️ Invalid URL format:", trimmedUrl)
    console.error("[v0] ⚠️ Falling back to default:", defaultUrl)
    return defaultUrl
  }
}

export const API_CONFIG = {
  // Primary endpoint (Cloud API)
  primary: {
    baseUrl: validateAndGetBaseUrl(),
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

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    console.error("[v0] ❌ CRITICAL: Invalid URL format:", url)
    console.error("[v0] ❌ Base URL:", config.baseUrl)
    throw new Error("Invalid API endpoint URL. Please check your OLLAMA_CLOUD_API environment variable.")
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (config.apiKey && config.apiKey.trim() !== "") {
    headers["Authorization"] = `Bearer ${config.apiKey}`
    const maskedKey = config.apiKey.substring(0, 8) + "..." + config.apiKey.substring(config.apiKey.length - 4)
    console.log("[v0] 🔑 Using API Key (masked):", maskedKey)
  } else {
    console.log("[v0] ⚠️ WARNING: No API key found!")
    console.log("[v0] ⚠️ EMILIOAI_API_KEY:", process.env.EMILIOAI_API_KEY ? "SET" : "NOT SET")
    console.log("[v0] ⚠️ OLLAMA_API_KEY:", process.env.OLLAMA_API_KEY ? "SET" : "NOT SET")
  }

  console.log("[v0] 🚀 Attempting connection to Emilio Server...")
  console.log("[v0] 📡 Endpoint:", usePrimary ? "Ollama Cloud" : "Self-hosted VPS")
  console.log("[v0] 🌐 Full URL:", url)
  console.log("[v0] 🤖 Model:", requestBody.model)

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
      console.error("[v0] ❌ API Error Response:")
      console.error("[v0] ❌ Status:", response.status)
      console.error("[v0] ❌ Status Text:", response.statusText)
      console.error("[v0] ❌ Body:", errorText)

      // Try to parse as JSON for better error details
      try {
        const errorJson = JSON.parse(errorText)
        console.error("[v0] ❌ Parsed Error:", errorJson)
      } catch (e) {
        console.error("[v0] ❌ Error body is not JSON")
      }

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
