import { neon } from "@neondatabase/serverless"
import { cacheConversationContext, getCachedConversationContext } from "./redis"

const sql = neon(process.env.DATABASE_URL!)

// Build AI context memory from conversation history
export async function buildAIMemory(userId: string, conversationId?: string) {
  // Try to get from cache first
  if (conversationId) {
    const cached = await getCachedConversationContext(conversationId)
    if (cached) return cached
  }

  // Get all user conversations for long-term memory
  const conversations =
    await sql`SELECT id, title, model, created_at FROM conversations WHERE user_id = ${userId} ORDER BY updated_at DESC LIMIT 20`

  // Get recent messages from current conversation
  let recentMessages: any[] = []
  if (conversationId) {
    recentMessages =
      await sql`SELECT role, content, created_at FROM messages WHERE conversation_id = ${conversationId} ORDER BY created_at DESC LIMIT 20`
    recentMessages.reverse() // Oldest first
  }

  // Build memory context
  const memory = {
    userId,
    conversationId,
    conversationHistory: conversations.map((c: any) => ({
      id: c.id,
      title: c.title,
      model: c.model,
      createdAt: c.created_at,
    })),
    recentMessages: recentMessages.map((m: any) => ({
      role: m.role,
      content: m.content,
      createdAt: m.created_at,
    })),
    conversationCount: conversations.length,
    messageCount: recentMessages.length,
  }

  // Cache the memory context
  if (conversationId) {
    await cacheConversationContext(conversationId, memory, 1800) // 30 minutes
  }

  return memory
}

// Generate memory summary for AI context
export function generateMemorySummary(memory: any) {
  const { conversationHistory, recentMessages, conversationCount } = memory

  let summary = `\n\n## CONTEXT MEMORY\n\n`
  summary += `You have access to ${conversationCount} previous conversations with this user.\n\n`

  if (conversationHistory.length > 0) {
    summary += `### Recent Conversation Topics:\n`
    conversationHistory.slice(0, 5).forEach((conv: any, idx: number) => {
      summary += `${idx + 1}. ${conv.title} (${new Date(conv.createdAt).toLocaleDateString()})\n`
    })
    summary += `\n`
  }

  if (recentMessages.length > 0) {
    summary += `### Current Conversation Context:\n`
    summary += `This conversation has ${recentMessages.length} messages. Here are the most recent:\n\n`
    recentMessages.slice(-5).forEach((msg: any) => {
      const preview = msg.content.substring(0, 100)
      summary += `- **${msg.role}**: ${preview}${msg.content.length > 100 ? "..." : ""}\n`
    })
  }

  summary += `\n**Instructions**: Use this context to provide more personalized and contextually aware responses. Reference previous conversations when relevant.\n\n`

  return summary
}

// Get conversation summary for agent planning
export async function getConversationSummary(conversationId: string) {
  const messages =
    await sql`SELECT role, content FROM messages WHERE conversation_id = ${conversationId} ORDER BY created_at ASC`

  if (messages.length === 0) return null

  return {
    messageCount: messages.length,
    firstMessage: messages[0],
    lastMessage: messages[messages.length - 1],
    userMessages: messages.filter((m: any) => m.role === "user").length,
    assistantMessages: messages.filter((m: any) => m.role === "assistant").length,
  }
}
