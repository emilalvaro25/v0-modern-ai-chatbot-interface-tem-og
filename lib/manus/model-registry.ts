/**
 * Model Registry - Source of truth for available Ollama Cloud models
 * Each model has capabilities, limits, and declared biases
 */

export interface ModelCapabilities {
  name: string
  tags: ModelTag[]
  maxContextTokens: number
  declaredBias: {
    quality: number // 0-1, higher = better quality
    latency: number // 0-1, higher = faster
    cost: number // 0-1, higher = cheaper (resource priority)
  }
}

export type ModelTag = "code" | "planning" | "long_context" | "fast" | "general" | "reasoning" | "review"

export const MODEL_REGISTRY: ModelCapabilities[] = [
  {
    name: "qwen2.5-coder:32b",
    tags: ["code", "reasoning", "general"],
    maxContextTokens: 32768,
    declaredBias: { quality: 0.9, latency: 0.5, cost: 0.6 },
  },
  {
    name: "qwen2.5:32b",
    tags: ["general", "reasoning", "planning"],
    maxContextTokens: 32768,
    declaredBias: { quality: 0.85, latency: 0.6, cost: 0.7 },
  },
  {
    name: "llama3.1:8b",
    tags: ["fast", "general", "code"],
    maxContextTokens: 8192,
    declaredBias: { quality: 0.7, latency: 0.9, cost: 0.9 },
  },
  {
    name: "deepseek-coder-v2:16b",
    tags: ["code", "fast"],
    maxContextTokens: 16384,
    declaredBias: { quality: 0.8, latency: 0.7, cost: 0.8 },
  },
  {
    name: "qwen2.5:72b",
    tags: ["reasoning", "planning", "review", "long_context"],
    maxContextTokens: 131072,
    declaredBias: { quality: 0.95, latency: 0.3, cost: 0.4 },
  },
]

export function getModelByName(name: string): ModelCapabilities | undefined {
  return MODEL_REGISTRY.find((m) => m.name === name)
}

export function getModelsByTag(tag: ModelTag): ModelCapabilities[] {
  return MODEL_REGISTRY.filter((m) => m.tags.includes(tag))
}
