import { Index } from "@upstash/vector"

// Initialize Upstash Search client
const index = new Index({
  url: process.env.UPSTASH_SEARCH_REST_URL!,
  token: process.env.UPSTASH_SEARCH_REST_TOKEN!,
})

// Index a conversation for search
export async function indexConversation(conversation: {
  id: string
  title: string
  userId: string
  messages: Array<{ role: string; content: string }>
}) {
  const conversationText = `${conversation.title} ${conversation.messages.map((m) => m.content).join(" ")}`

  await index.upsert({
    id: conversation.id,
    vector: conversationText,
    metadata: {
      title: conversation.title,
      userId: conversation.userId,
      messageCount: conversation.messages.length,
      lastMessage: conversation.messages[conversation.messages.length - 1]?.content || "",
    },
  })
}

// Search conversations
export async function searchConversations(query: string, userId: string, limit = 10) {
  const results = await index.query({
    data: query,
    topK: limit,
    includeMetadata: true,
    filter: `userId = '${userId}'`,
  })

  return results
}

// Delete conversation from search index
export async function deleteConversationFromIndex(conversationId: string) {
  await index.delete(conversationId)
}

// Update conversation in search index
export async function updateConversationInIndex(conversation: {
  id: string
  title: string
  userId: string
  messages: Array<{ role: string; content: string }>
}) {
  await indexConversation(conversation)
}
