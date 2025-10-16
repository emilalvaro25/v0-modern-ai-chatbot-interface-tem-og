import { neon } from "@neondatabase/serverless"

// Lazy initialization of database client
let sqlClient: any = null

export function getSql() {
  if (!sqlClient) {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
    
    if (!databaseUrl) {
      console.warn('[Database] Database URL not configured, returning mock client for build compatibility')
      // Return a mock client for build-time compatibility that mimics neon's tagged template interface
      return function mockSql(strings: TemplateStringsArray, ...values: any[]) {
        return Promise.resolve([])
      } as any
    }
    
    try {
      sqlClient = neon(databaseUrl)
    } catch (error) {
      console.warn('[Database] Failed to initialize database client:', error)
      // Return mock client on initialization failure
      return function mockSql(strings: TemplateStringsArray, ...values: any[]) {
        return Promise.resolve([])
      } as any
    }
  }
  return sqlClient
}
