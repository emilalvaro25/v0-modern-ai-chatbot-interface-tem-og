import { Index } from "@upstash/vector"

// Lazy initialization of Upstash Search client
let indexInstance: Index | null = null

function getIndex(): Index {
  if (!indexInstance) {
    const url = process.env.UPSTASH_SEARCH_REST_URL || process.env.UPSTASH_VECTOR_REST_URL
    const token = process.env.UPSTASH_SEARCH_REST_TOKEN || process.env.UPSTASH_VECTOR_REST_TOKEN
    
    if (!url || !token) {
      throw new Error('Upstash Vector configuration is missing. Please set UPSTASH_SEARCH_REST_URL and UPSTASH_SEARCH_REST_TOKEN environment variables.')
    }
    
    indexInstance = new Index({
      url,
      token,
    })
  }
  return indexInstance
}

// Index a conversation for search
export async function indexConversation(conversation: {
  id: string
  title: string
  userId: string
  messages: Array<{ role: string; content: string }>
}) {
  try {
    const index = getIndex()
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
  } catch (error) {
    console.error('[Search] Failed to index conversation:', error)
    throw error
  }
}

// Search conversations
export async function searchConversations(query: string, userId: string, limit = 10) {
  try {
    const index = getIndex()
    const results = await index.query({
      data: query,
      topK: limit,
      includeMetadata: true,
      filter: `userId = '${userId}'`,
    })

    return results
  } catch (error) {
    console.error('[Search] Failed to search conversations:', error)
    throw error
  }
}

// Delete conversation from search index
export async function deleteConversationFromIndex(conversationId: string) {
  try {
    const index = getIndex()
    await index.delete(conversationId)
  } catch (error) {
    console.error('[Search] Failed to delete conversation from index:', error)
    throw error
  }
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