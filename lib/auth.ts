import { getSql } from "@/lib/database"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export interface User {
  id: string
  email: string
  name: string | null
  role: string
  organization: string | null
  created_at: Date
  last_login: Date | null
  is_active: boolean
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  created_at: Date
  ip_address: string | null
  user_agent: string | null
}

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "hyperfocus-secret-key-change-in-production"
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verify a password against its hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "24h" })
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<{ user: User; session: Session; token: string } | null> {
  const sql = getSql()

  // Find user by email
  const users = await sql`
    SELECT id, email, password_hash, name, role, organization, created_at, last_login, is_active
    FROM users
    WHERE email = ${email} AND is_active = true
  `

  if (users.length === 0) {
    return null
  }

  const user = users[0]

  // Verify password
  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) {
    return null
  }

  // Generate token
  const token = generateToken(user.id)

  // Create session
  const expiresAt = new Date(Date.now() + SESSION_DURATION)
  const sessions = await sql`
    INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent)
    VALUES (${user.id}, ${token}, ${expiresAt}, ${ipAddress || null}, ${userAgent || null})
    RETURNING id, user_id, token, expires_at, created_at, ip_address, user_agent
  `

  const session = sessions[0]

  // Update last login
  await sql`
    UPDATE users
    SET last_login = NOW()
    WHERE id = ${user.id}
  `

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: "login",
    resourceType: "auth",
    ipAddress,
    userAgent,
    status: "success",
    details: { method: "credentials" },
  })

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
      created_at: user.created_at,
      last_login: user.last_login,
      is_active: user.is_active,
    },
    session,
    token,
  }
}

/**
 * Create a new user account
 */
export async function createUser(
  email: string,
  password: string,
  name?: string,
  organization?: string,
): Promise<User> {
  const sql = getSql()

  // Hash password
  const passwordHash = await hashPassword(password)

  // Create user
  const users = await sql`
    INSERT INTO users (email, password_hash, name, organization)
    VALUES (${email}, ${passwordHash}, ${name || null}, ${organization || null})
    RETURNING id, email, name, role, organization, created_at, last_login, is_active
  `

  const user = users[0]

  // Log audit event
  await logAuditEvent({
    userId: user.id,
    action: "user_created",
    resourceType: "user",
    resourceId: user.id,
    status: "success",
    details: { email, role: user.role },
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization,
    created_at: user.created_at,
    last_login: user.last_login,
    is_active: user.is_active,
  }
}

/**
 * Get user by session token
 */
export async function getUserByToken(token: string): Promise<User | null> {
  const sql = getSql()

  // Verify token
  const decoded = verifyToken(token)
  if (!decoded) {
    return null
  }

  // Check session exists and is not expired
  const sessions = await sql`
    SELECT user_id
    FROM sessions
    WHERE token = ${token} AND expires_at > NOW()
  `

  if (sessions.length === 0) {
    return null
  }

  // Get user
  const users = await sql`
    SELECT id, email, name, role, organization, created_at, last_login, is_active
    FROM users
    WHERE id = ${sessions[0].user_id} AND is_active = true
  `

  if (users.length === 0) {
    return null
  }

  const user = users[0]
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organization: user.organization,
    created_at: user.created_at,
    last_login: user.last_login,
    is_active: user.is_active,
  }
}

/**
 * Logout user by invalidating session
 */
export async function logout(token: string): Promise<boolean> {
  const sql = getSql()

  const result = await sql`
    DELETE FROM sessions
    WHERE token = ${token}
    RETURNING user_id
  `

  if (result.length > 0) {
    await logAuditEvent({
      userId: result[0].user_id,
      action: "logout",
      resourceType: "auth",
      status: "success",
    })
    return true
  }

  return false
}

/**
 * Check if user has specific role
 */
export function hasRole(user: User, role: string): boolean {
  return user.role === role
}

/**
 * Check if user is EY tester
 */
export function isEYTester(user: User): boolean {
  return user.role === "ey_tester" || user.role === "admin"
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User): boolean {
  return user.role === "admin"
}

/**
 * Log audit event
 */
export async function logAuditEvent(event: {
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  status: "success" | "failure" | "warning"
  details?: any
}): Promise<void> {
  const sql = getSql()

  try {
    await sql`
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        ip_address, user_agent, status, details
      )
      VALUES (
        ${event.userId || null},
        ${event.action},
        ${event.resourceType || null},
        ${event.resourceId || null},
        ${event.ipAddress || null},
        ${event.userAgent || null},
        ${event.status},
        ${JSON.stringify(event.details || {})}
      )
    `
  } catch (error) {
    console.error("Failed to log audit event:", error)
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const sql = getSql()

  const result = await sql`
    DELETE FROM sessions
    WHERE expires_at < NOW()
    RETURNING id
  `

  return result.length
}
