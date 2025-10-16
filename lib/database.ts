import { neon } from "@neondatabase/serverless"

// Lazy initialization of database client
let sqlClient: any = null

export function getSql() {
  if (!sqlClient) {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
    
    if (!databaseUrl) {
      console.warn('[Database] Database URL not configured, database operations will fail at runtime')
      // Return a mock client for build-time compatibility
      return {
        query: async () => {
          throw new Error('Database not configured')
        }
      } as any
    }
    
    sqlClient = neon(databaseUrl)
  }
  return sqlClient
}