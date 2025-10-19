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

// Function to validate API key format
function validateApiKey(key: string | undefined): { valid: boolean; error?: string } {
  if (!key || key.trim() === "") {
    return { valid: false, error: "API key is empty or not set" }
  }

  const trimmedKey = key.trim()

  // Ollama Cloud API keys should have format: xxxxx.xxxxx (two parts separated by dot)
  if (!trimmedKey.includes(".")) {
    return { valid: false, error: "API key format invalid (should contain a dot separator)" }
  }

  const parts = trimmedKey.split(".")
  if (parts.length !== 2) {
    return { valid: false, error: "API key format invalid (should have exactly two parts)" }
  }

  if (parts[0].length < 8 || parts[1].length < 8) {
    return { valid: false, error: "API key format invalid (parts too short)" }
  }

  return { valid: true }
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

  if (usePrimary) {
    const keyValidation = validateApiKey(config.apiKey)

    if (!keyValidation.valid) {
      console.error("[v0] ❌ API Key Validation Failed:", keyValidation.error)
      console.error("[v0] ❌ EMILIOAI_API_KEY:", process.env.EMILIOAI_API_KEY ? "SET (but invalid)" : "NOT SET")
      console.error("[v0] ❌ OLLAMA_API_KEY:", process.env.OLLAMA_API_KEY ? "SET (but invalid)" : "NOT SET")
      console.error("[v0] 💡 Expected format: xxxxxxxx.xxxxxxxx (32+ chars with dot separator)")
      throw new Error(`API key validation failed: ${keyValidation.error}`)
    }

    headers["Authorization"] = `Bearer ${config.apiKey}`
    const maskedKey = config.apiKey.substring(0, 8) + "..." + config.apiKey.substring(config.apiKey.length - 4)
    console.log("[v0] 🔑 Using API Key (masked):", maskedKey)
    console.log("[v0] ✓ API Key format validated successfully")
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

    console.log("[v0] ✓ Response received")
    console.log("[v0] Status:", response.status, response.statusText)
    console.log("[v0] Content-Type:", response.headers.get("content-type"))

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unable to read error")
      console.error("[v0] ❌ API Error Response:")
      console.error("[v0] ❌ Status:", response.status)
      console.error("[v0] ❌ Status Text:", response.statusText)
      console.error("[v0] ❌ Body:", errorText)

      try {
        const errorJson = JSON.parse(errorText)
        console.error("[v0] ❌ Parsed Error:", errorJson)

        // Check for authentication errors
        if (response.status === 401 || response.status === 403) {
          console.error("[v0] ❌ AUTHENTICATION FAILED")
          console.error("[v0] 💡 Your API key is invalid or expired")
          console.error("[v0] 💡 Please notify Master E to check the EMILIOAI_API_KEY")
        }
      } catch (e) {
        console.error("[v0] ❌ Error body is not JSON")
      }

      if (usePrimary) {
        console.log("[v0] ⚠️ Primary endpoint failed, trying fallback VPS...")
        return callOllamaAPI(requestBody, false)
      }
    }

    return response
  } catch (error) {
    console.error("[v0] ❌ Network error:", error instanceof Error ? error.message : "Unknown error")

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("[v0] ❌ Request timeout (60s)")
      } else if (error.message.includes("fetch")) {
        console.error("[v0] ❌ Network connection failed")
      }
    }

    if (usePrimary) {
      console.log("[v0] ⚠️ Trying fallback VPS after network error...")
      try {
        return await callOllamaAPI(requestBody, false)
      } catch (fallbackError) {
        console.error("[v0] ❌ Fallback also failed:", fallbackError)
        throw error
      }
    }
    throw error
  }
}

export async function testOllamaConnection(): Promise<{ success: boolean; error?: string; endpoint?: string }> {
  try {
    console.log("[v0] 🧪 Testing Ollama Cloud connection...")

    const keyValidation = validateApiKey(API_CONFIG.primary.apiKey)
    if (!keyValidation.valid) {
      return {
        success: false,
        error: `API key validation failed: ${keyValidation.error}`,
      }
    }

    const testRequest = {
      model: "gpt-oss:20b-cloud",
      messages: [{ role: "user", content: "test" }],
      stream: false,
    }

    const response = await callOllamaAPI(testRequest, true)

    if (response.ok) {
      console.log("[v0] ✓ Connection test successful!")
      return {
        success: true,
        endpoint: API_CONFIG.primary.baseUrl,
      }
    } else {
      const errorText = await response.text().catch(() => "Unknown error")
      return {
        success: false,
        error: `API returned ${response.status}: ${errorText}`,
        endpoint: API_CONFIG.primary.baseUrl,
      }
    }
  } catch (error) {
    console.error("[v0] ❌ Connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
