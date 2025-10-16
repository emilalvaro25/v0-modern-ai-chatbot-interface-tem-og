export interface LLMModel {
  id: string
  name: string
  alias: string
  provider: string
  icon: string
  enabled: boolean
  thinking: boolean
  contextWindow?: string
  systemPrompt: string
}

export interface LLMProvider {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  fields: ProviderField[]
  models: LLMModel[]
}

export interface ProviderField {
  key: string
  label: string
  type: "text" | "password" | "url"
  placeholder: string
  required: boolean
  value?: string
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: "ollama-cloud",
    name: "Emilio Cloud",
    description: "Cloud-hosted Emilio AI models",
    icon: "☁️",
    enabled: true,
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "Enter Emilio Cloud API Key",
        required: true,
      },
      {
        key: "endpoint",
        label: "API Endpoint",
        type: "url",
        placeholder: "https://api.ollama.ai",
        required: false,
      },
    ],
    models: [
      {
        id: "gpt-oss-120b",
        name: "gpt-oss:120b-cloud",
        alias: "Emilio-120b",
        provider: "ollama-cloud",
        icon: "🚀",
        enabled: true,
        thinking: false,
        contextWindow: "120K",
        systemPrompt:
          "You are Emilio, a highly capable AI assistant created by Emilio AI. You provide accurate, helpful, and engaging responses.",
      },
      {
        id: "gpt-oss-120b-thinking",
        name: "gpt-oss:120b-cloud",
        alias: "Emilio-120b-Thinking",
        provider: "ollama-cloud",
        icon: "🧠",
        enabled: true,
        thinking: true,
        contextWindow: "120K",
        systemPrompt: "You are Emilio in thinking mode. Show your reasoning process before providing answers.",
      },
      {
        id: "gpt-oss-20b",
        name: "gpt-oss:20b-cloud",
        alias: "Emilio-flash-20b",
        provider: "ollama-cloud",
        icon: "⚡",
        enabled: true,
        thinking: false,
        contextWindow: "32K",
        systemPrompt: "You are Emilio Flash, optimized for quick and efficient responses.",
      },
      {
        id: "deepseek-v31",
        name: "deepseek-v3.1:671b-cloud",
        alias: "Aquilles-V3.1",
        provider: "ollama-cloud",
        icon: "🎯",
        enabled: true,
        thinking: false,
        contextWindow: "64K",
        systemPrompt: "You are Aquilles, specialized in deep analysis and research tasks.",
      },
      {
        id: "qwen3-coder",
        name: "qwen3-coder:480b-cloud",
        alias: "Alex-Coder",
        provider: "ollama-cloud",
        icon: "💻",
        enabled: true,
        thinking: true,
        contextWindow: "32K",
        systemPrompt:
          "You are Alex-Coder, an expert coding assistant. You write clean, efficient, and well-documented code.",
      },
    ],
  },
  {
    id: "ollama-local",
    name: "Local Emilio Server",
    description: "Self-hosted Emilio AI instance",
    icon: "🖥️",
    enabled: true,
    fields: [
      {
        key: "endpoint",
        label: "Server URL",
        type: "url",
        placeholder: "http://168.231.78.113:11434",
        required: true,
        value: "http://168.231.78.113:11434",
      },
    ],
    models: [],
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    description: "Access Hugging Face models",
    icon: "🤗",
    enabled: false,
    fields: [
      {
        key: "apiKey",
        label: "API Token",
        type: "password",
        placeholder: "hf_...",
        required: true,
      },
    ],
    models: [
      {
        id: "hf-llama-3",
        name: "meta-llama/Llama-3-70b-chat-hf",
        alias: "Llama 3 70B",
        provider: "huggingface",
        icon: "🦙",
        enabled: false,
        thinking: false,
        contextWindow: "8K",
        systemPrompt: "You are a helpful AI assistant powered by Llama 3.",
      },
      {
        id: "hf-mistral",
        name: "mistralai/Mistral-7B-Instruct-v0.2",
        alias: "Mistral 7B",
        provider: "huggingface",
        icon: "🌪️",
        enabled: false,
        thinking: false,
        contextWindow: "32K",
        systemPrompt: "You are a helpful AI assistant powered by Mistral.",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "OpenAI GPT models",
    icon: "🤖",
    enabled: false,
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-...",
        required: true,
      },
    ],
    models: [
      {
        id: "gpt-4",
        name: "gpt-4",
        alias: "GPT-4",
        provider: "openai",
        icon: "🧩",
        enabled: false,
        thinking: false,
        contextWindow: "8K",
        systemPrompt: "You are a helpful AI assistant.",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude models by Anthropic",
    icon: "🎭",
    enabled: false,
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-ant-...",
        required: true,
      },
    ],
    models: [
      {
        id: "claude-3",
        name: "claude-3-opus-20240229",
        alias: "Claude 3 Opus",
        provider: "anthropic",
        icon: "🎨",
        enabled: false,
        thinking: false,
        contextWindow: "200K",
        systemPrompt: "You are Claude, a helpful AI assistant created by Vercel.",
      },
    ],
  },
]
