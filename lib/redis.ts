import { Redis } from "@upstash/redis"

// Lazy initialization of Upstash Redis client
let redisInstance: Redis | null = null

function getRedis(): Redis {
  if (!redisInstance) {
    // Try different environment variable patterns
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
    
    if (!url || !token) {
      console.warn('[Redis] Redis configuration missing, some features may not work properly')
      // Return a mock Redis client for build-time compatibility
      return {
        setex: async () => null,
        get: async () => null,
        del: async () => null,
      } as any
    }
    
    redisInstance = new Redis({
      url,
      token,
    })
  }
  return redisInstance
}

// Cache conversation context for quick access
export async function cacheConversationContext(
  conversationId: string,
  context: any,
  ttl = 3600, // 1 hour default
) {
  try {
    const redis = getRedis()
    await redis.setex(`conversation:${conversationId}`, ttl, JSON.stringify(context))
  } catch (error) {
    console.error('[Redis] Failed to cache conversation context:', error)
  }
}

// Get cached conversation context
export async function getCachedConversationContext(conversationId: string) {
  try {
    const redis = getRedis()
    const cached = await redis.get(`conversation:${conversationId}`)
    return cached ? JSON.parse(cached as string) : null
  } catch (error) {
    console.error('[Redis] Failed to get cached conversation context:', error)
    return null
  }
}

// Cache user session data
export async function cacheUserSession(userId: string, sessionData: any, ttl = 86400) {
  try {
    const redis = getRedis()
    await redis.setex(`session:${userId}`, ttl, JSON.stringify(sessionData))
  } catch (error) {
    console.error('[Redis] Failed to cache user session:', error)
  }
}

// Get cached user session
export async function getCachedUserSession(userId: string) {
  try {
    const redis = getRedis()
    const cached = await redis.get(`session:${userId}`)
    return cached ? JSON.parse(cached as string) : null
  } catch (error) {
    console.error('[Redis] Failed to get cached user session:', error)
    return null
  }
}

// Store recent messages for quick access
export async function cacheRecentMessages(conversationId: string, messages: any[], ttl = 3600) {
  try {
    const redis = getRedis()
    await redis.setex(`messages:${conversationId}`, ttl, JSON.stringify(messages))
  } catch (error) {
    console.error('[Redis] Failed to cache recent messages:', error)
  }
}

// Get cached recent messages
export async function getCachedRecentMessages(conversationId: string) {
  try {
    const redis = getRedis()
    const cached = await redis.get(`messages:${conversationId}`)
    return cached ? JSON.parse(cached as string) : null
  } catch (error) {
    console.error('[Redis] Failed to get cached recent messages:', error)
    return null
  }
}

// Invalidate conversation cache
export async function invalidateConversationCache(conversationId: string) {
  try {
    const redis = getRedis()
    await redis.del(`conversation:${conversationId}`, `messages:${conversationId}`)
  } catch (error) {
    console.error('[Redis] Failed to invalidate conversation cache:', error)
  }
}
