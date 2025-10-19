import { Redis } from '@upstash/redis'
import { Index } from '@upstash/vector'

// Lazy initialization of Redis clients
let redisClient: Redis | null = null
let vectorIndex: Index | null = null

/**
 * Get or create Upstash Redis client
 */
export function getRedis(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_URL
    const token = process.env.UPSTASH_REDIS_TOKEN

    if (!url || !token) {
      console.warn('[Redis] Upstash Redis credentials not configured')
      throw new Error('Upstash Redis credentials not configured')
    }

    redisClient = new Redis({
      url,
      token,
    })
  }

  return redisClient
}

/**
 * Get or create Upstash Vector Index client
 */
export function getVectorIndex(): Index {
  if (!vectorIndex) {
    const url = process.env.UPSTASH_VECTOR_URL
    const token = process.env.UPSTASH_VECTOR_TOKEN

    if (!url || !token) {
      console.warn('[Vector] Upstash Vector credentials not configured')
      throw new Error('Upstash Vector credentials not configured')
    }

    vectorIndex = new Index({
      url,
      token,
    })
  }

  return vectorIndex
}

/**
 * Cache utilities with TTL support
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedis()
      const value = await redis.get(key)
      return value as T | null
    } catch (error) {
      console.error('[Redis] Error getting cache:', error)
      return null
    }
  },

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const redis = getRedis()
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('[Redis] Error setting cache:', error)
      return false
    }
  },

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const redis = getRedis()
      await redis.del(key)
      return true
    } catch (error) {
      console.error('[Redis] Error deleting cache:', error)
      return false
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const redis = getRedis()
      const result = await redis.exists(key)
      return result === 1
    } catch (error) {
      console.error('[Redis] Error checking existence:', error)
      return false
    }
  },

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    try {
      const redis = getRedis()
      return await redis.incr(key)
    } catch (error) {
      console.error('[Redis] Error incrementing:', error)
      return 0
    }
  },

  /**
   * Set expiry on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const redis = getRedis()
      await redis.expire(key, seconds)
      return true
    } catch (error) {
      console.error('[Redis] Error setting expiry:', error)
      return false
    }
  },
}

/**
 * Vector search utilities
 */
export const vectorSearch = {
  /**
   * Upsert vector with metadata
   */
  async upsert(id: string, vector: number[], metadata?: Record<string, any>): Promise<boolean> {
    try {
      const index = getVectorIndex()
      await index.upsert({
        id,
        vector,
        metadata,
      })
      return true
    } catch (error) {
      console.error('[Vector] Error upserting:', error)
      return false
    }
  },

  /**
   * Query similar vectors
   */
  async query(
    vector: number[],
    options?: {
      topK?: number
      includeMetadata?: boolean
      filter?: string
    }
  ): Promise<any[]> {
    try {
      const index = getVectorIndex()
      const results = await index.query({
        vector,
        topK: options?.topK || 10,
        includeMetadata: options?.includeMetadata ?? true,
        filter: options?.filter,
      })
      return results
    } catch (error) {
      console.error('[Vector] Error querying:', error)
      return []
    }
  },

  /**
   * Delete vector by ID
   */
  async delete(id: string): Promise<boolean> {
    try {
      const index = getVectorIndex()
      await index.delete(id)
      return true
    } catch (error) {
      console.error('[Vector] Error deleting:', error)
      return false
    }
  },

  /**
   * Fetch vector by ID
   */
  async fetch(ids: string[]): Promise<any[]> {
    try {
      const index = getVectorIndex()
      const results = await index.fetch(ids)
      return results
    } catch (error) {
      console.error('[Vector] Error fetching:', error)
      return []
    }
  },
}

/**
 * Session management utilities
 */
export const sessionCache = {
  /**
   * Store session data
   */
  async set(sessionId: string, data: any, ttl: number = 3600): Promise<boolean> {
    return cache.set(`session:${sessionId}`, data, ttl)
  },

  /**
   * Get session data
   */
  async get(sessionId: string): Promise<any | null> {
    return cache.get(`session:${sessionId}`)
  },

  /**
   * Delete session
   */
  async delete(sessionId: string): Promise<boolean> {
    return cache.del(`session:${sessionId}`)
  },

  /**
   * Refresh session TTL
   */
  async refresh(sessionId: string, ttl: number = 3600): Promise<boolean> {
    return cache.expire(`session:${sessionId}`, ttl)
  },
}

/**
 * Rate limiting utilities
 */
export const rateLimiter = {
  /**
   * Check rate limit
   */
  async check(
    key: string,
    options: {
      limit: number
      window: number // in seconds
    }
  ): Promise<{ allowed: boolean; remaining: number; reset: number }> {
    try {
      const redis = getRedis()
      const now = Date.now()
      const windowKey = `ratelimit:${key}:${Math.floor(now / (options.window * 1000))}`

      const count = await redis.incr(windowKey)
      
      if (count === 1) {
        await redis.expire(windowKey, options.window)
      }

      const allowed = count <= options.limit
      const remaining = Math.max(0, options.limit - count)
      const reset = Math.ceil(now / (options.window * 1000)) * options.window

      return { allowed, remaining, reset }
    } catch (error) {
      console.error('[RateLimit] Error checking rate limit:', error)
      return { allowed: true, remaining: 0, reset: 0 }
    }
  },
}

export default {
  getRedis,
  getVectorIndex,
  cache,
  vectorSearch,
  sessionCache,
  rateLimiter,
}
