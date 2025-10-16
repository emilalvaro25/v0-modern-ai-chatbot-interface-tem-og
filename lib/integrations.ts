export interface Integration {
  id: string
  name: string
  description: string
  icon: string
  category: "productivity" | "communication" | "media" | "storage" | "design"
  enabled: boolean
  connected: boolean
  supportsOAuth: boolean
  oauthUrl?: string
  fields: IntegrationField[]
  availableFunctions?: string[]
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
    id: "google-services",
    name: "Google Services",
    description: "Connect to Gmail, Drive, Docs, Sheets, and Slides",
    icon: "🔵",
    category: "productivity",
    enabled: false,
    connected: false,
    supportsOAuth: true,
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
        key: "redirectUrl",
        label: "Authorized Redirect URL",
        type: "url",
        placeholder: "https://yourdomain.com/api/oauth/google/callback",
        required: true,
      },
    ],
    availableFunctions: [
      "send_email",
      "read_emails",
      "create_document",
      "edit_document",
      "create_spreadsheet",
      "read_spreadsheet",
      "create_presentation",
      "upload_file",
      "download_file",
      "list_files",
    ],
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Connect to Spotify for music playback and playlist management",
    icon: "🎵",
    category: "media",
    enabled: false,
    connected: false,
    supportsOAuth: true,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Spotify Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
      {
        key: "redirectUrl",
        label: "Redirect URL",
        type: "url",
        placeholder: "https://yourdomain.com/api/oauth/spotify/callback",
        required: true,
      },
    ],
    availableFunctions: ["play_track", "pause_playback", "create_playlist", "add_to_playlist", "search_tracks"],
  },
  {
    id: "youtube",
    name: "YouTube",
    description: "Access YouTube videos and manage playlists",
    icon: "📺",
    category: "media",
    enabled: false,
    connected: false,
    supportsOAuth: false,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter YouTube API Key", required: true },
    ],
    availableFunctions: ["search_videos", "get_video_details", "create_playlist", "add_to_playlist"],
  },
  {
    id: "canva",
    name: "Canva",
    description: "Create and edit designs with Canva integration",
    icon: "🎨",
    category: "design",
    enabled: false,
    connected: false,
    supportsOAuth: true,
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter Canva API Key", required: true },
      {
        key: "redirectUrl",
        label: "Redirect URL",
        type: "url",
        placeholder: "https://yourdomain.com/api/oauth/canva/callback",
        required: false,
      },
    ],
    availableFunctions: ["create_design", "edit_design", "export_design", "list_designs"],
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send messages and manage Slack workspaces",
    icon: "💬",
    category: "communication",
    enabled: false,
    connected: false,
    supportsOAuth: true,
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Enter Slack Client ID", required: true },
      {
        key: "clientSecret",
        label: "Client Secret",
        type: "password",
        placeholder: "Enter Client Secret",
        required: true,
      },
      {
        key: "redirectUrl",
        label: "Redirect URL",
        type: "url",
        placeholder: "https://yourdomain.com/api/oauth/slack/callback",
        required: true,
      },
    ],
    availableFunctions: ["send_message", "create_channel", "list_channels", "upload_file"],
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Send WhatsApp messages via Business API",
    icon: "📱",
    category: "communication",
    enabled: false,
    connected: false,
    supportsOAuth: false,
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
    availableFunctions: ["send_message", "send_template", "get_message_status"],
  },
]
