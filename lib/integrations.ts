export interface Integration {
  id: string
  name: string
  description: string
  icon: string
  category: "productivity" | "communication" | "media" | "storage" | "design"
  enabled: boolean
  fields: IntegrationField[]
}

export interface IntegrationField {
  key: string
  label: string
  type: "text" | "password" | "url"
  placeholder: string
  required: boolean
  value?: string
}

export const INTEGRATIONS: Integration[] = [
  {
    id: "spotify",
    name: "Spotify",
    description: "Connect to Spotify for music playback and playlist management",
    icon: "🎵",
    category: "media",
    enabled: false,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Spotify Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
    ],
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Access YouTube videos and manage playlists",
    icon: "📺",
    category: "media",
    enabled: false,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter YouTube API Key", required: true },
    ],
  },
  {
    id: "canva",
    name: "Canva",
    description: "Create and edit designs with Canva integration",
    icon: "🎨",
    category: "design",
    enabled: false,
    fields: [{ key: "apiKey", label: "API Key", type: "password", placeholder: "Enter Canva API Key", required: true }],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages and manage Slack workspaces",
    icon: "💬",
    category: "communication",
    enabled: false,
    fields: [
      { key: "botToken", label: "Bot Token", type: "password", placeholder: "xoxb-...", required: true },
      {
        key: "webhookUrl",
        label: "Webhook URL",
        type: "url",
        placeholder: "https://hooks.slack.com/...",
        required: false,
      },
    ],
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "Send WhatsApp messages via Business API",
    icon: "📱",
    category: "communication",
    enabled: false,
    fields: [
      {
        key: "phoneNumberId",
        label: "Phone Number ID",
        type: "text",
        placeholder: "Enter Phone Number ID",
        required: true,
      },
      {
        key: "accessToken",
        label: "Access Token",
        type: "password",
        placeholder: "Enter Access Token",
        required: true,
      },
    ],
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Send and manage emails through Gmail",
    icon: "📧",
    category: "productivity",
    enabled: false,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Google Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
      {
        key: "refreshToken",
        label: "Refresh Token",
        type: "password",
        placeholder: "Enter Refresh Token",
        required: true,
      },
    ],
  },
  {
    id: "google-sheets",
    name: "Google Sheets",
    description: "Read and write data to Google Sheets",
    icon: "📊",
    category: "productivity",
    enabled: false,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Google Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
      {
        key: "refreshToken",
        label: "Refresh Token",
        type: "password",
        placeholder: "Enter Refresh Token",
        required: true,
      },
    ],
  },
  {
    id: "google-slides",
    name: "Google Slides",
    description: "Create and edit presentations",
    icon: "📽️",
    category: "productivity",
    enabled: false,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Google Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
      {
        key: "refreshToken",
        label: "Refresh Token",
        type: "password",
        placeholder: "Enter Refresh Token",
        required: true,
      },
    ],
  },
  {
    id: "google-docs",
    name: "Google Docs",
    description: "Create and edit documents",
    icon: "📝",
    category: "productivity",
    enabled: false,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Google Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
      {
        key: "refreshToken",
        label: "Refresh Token",
        type: "password",
        placeholder: "Enter Refresh Token",
        required: true,
      },
    ],
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Access and manage files in Google Drive",
    icon: "💾",
    category: "storage",
    enabled: false,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Google Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
      {
        key: "refreshToken",
        label: "Refresh Token",
        type: "password",
        placeholder: "Enter Refresh Token",
        required: true,
      },
    ],
  },
]
