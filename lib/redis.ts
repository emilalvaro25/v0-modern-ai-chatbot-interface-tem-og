import { Redis } from "@upstash/redis"

// Initialize Upstash Redis client
export const redis = Redis.fromEnv()

// Cache conversation context for quick access
export async function cacheConversationContext(
  conversationId: string,
  context: any,
  ttl = 3600, // 1 hour default
) {
  await redis.setex(`conversation:${conversationId}`, ttl, JSON.stringify(context))
}

// Get cached conversation context
export async function getCachedConversationContext(conversationId: string) {
  const cached = await redis.get(`conversation:${conversationId}`)
  return cached ? JSON.parse(cached as string) : null
}

// Cache user session data
export async function cacheUserSession(userId: string, sessionData: any, ttl = 86400) {
  await redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData))
}

// Get cached user session
export async function getCachedUserSession(userId: string) {
  const cached = await redis.get(`session:${userId}`)
  return cached ? JSON.parse(cached as string) : null
}

// Store recent messages for quick access
export async function cacheRecentMessages(conversationId: string, messages: any[], ttl = 3600) {
  await redis.setex(`messages:${conversationId}`, ttl, JSON.stringify(messages))
}

// Get cached recent messages
export async function getCachedRecentMessages(conversationId: string) {
  const cached = await redis.get(`messages:${conversationId}`)
  return cached ? JSON.parse(cached as string) : null
}

// Invalidate conversation cache
export async function invalidateConversationCache(conversationId: string) {
  await redis.del(`conversation:${conversationId}`, `messages:${conversationId}`)
}
