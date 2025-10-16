export interface IntegrationTool {
  name: string
  description: string
  provider: string
  parameters: Record<string, any>
  execute: (params: any, tokens: any) => Promise<any>
}

export const INTEGRATION_TOOLS: IntegrationTool[] = [
  {
    name: "send_email",
    description: "Send an email via Gmail",
    provider: "google-services",
    parameters: {
      to: { type: "string", required: true, description: "Recipient email address" },
      subject: { type: "string", required: true, description: "Email subject" },
      body: { type: "string", required: true, description: "Email body content" },
    },
    execute: async (params, tokens) => {
      // Implementation for sending email via Gmail API
      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: Buffer.from(`To: ${params.to}\r\nSubject: ${params.subject}\r\n\r\n${params.body}`).toString("base64"),
        }),
      })
      return await response.json()
    },
  },
  {
    name: "create_document",
    description: "Create a new Google Doc",
    provider: "google-services",
    parameters: {
      title: { type: "string", required: true, description: "Document title" },
      content: { type: "string", required: false, description: "Initial document content" },
    },
    execute: async (params, tokens) => {
      // Implementation for creating Google Doc
      const response = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: params.title }),
      })
      return await response.json()
    },
  },
  {
    name: "play_track",
    description: "Play a track on Spotify",
    provider: "spotify",
    parameters: {
      trackUri: { type: "string", required: true, description: "Spotify track URI" },
    },
    execute: async (params, tokens) => {
      const response = await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [params.trackUri] }),
      })
      return { success: response.ok }
    },
  },
  {
    name: "send_slack_message",
    description: "Send a message to a Slack channel",
    provider: "slack",
    parameters: {
      channel: { type: "string", required: true, description: "Channel ID" },
      text: { type: "string", required: true, description: "Message text" },
    },
    execute: async (params, tokens) => {
      const response = await fetch("https://slack.com/api/chat.postMessage", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel: params.channel,
          text: params.text,
        }),
      })
      return await response.json()
    },
  },
]

export function getAvailableTools(connectedIntegrations: string[]): IntegrationTool[] {
  return INTEGRATION_TOOLS.filter((tool) => connectedIntegrations.includes(tool.provider))
}
