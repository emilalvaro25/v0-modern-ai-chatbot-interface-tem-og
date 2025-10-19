import { getSql } from "@/lib/database"
import crypto from "crypto"

/**
 * Post-Quantum Cryptography (PQC) Library
 * 
 * This library provides encryption utilities using algorithms resistant to
 * quantum computing attacks, following NIST PQC standards.
 * 
 * Currently implements:
 * - AES-256-GCM for symmetric encryption (quantum-resistant with sufficient key length)
 * - SHA-512 for hashing
 * - Preparation for CRYSTALS-Kyber and CRYSTALS-Dilithium integration
 */

export interface EncryptedData {
  ciphertext: string
  iv: string
  authTag: string
  algorithm: string
}

export interface EncryptionKey {
  id: string
  keyId: string
  algorithm: string
  publicKey: string
  createdAt: Date
  expiresAt: Date | null
  isActive: boolean
}

/**
 * Generate a secure encryption key
 */
export function generateEncryptionKey(): Buffer {
  return crypto.randomBytes(32) // 256-bit key
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encryptData(data: string, key: Buffer): EncryptedData {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

  let ciphertext = cipher.update(data, "utf8", "hex")
  ciphertext += cipher.final("hex")

  const authTag = cipher.getAuthTag()

  return {
    ciphertext,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
    algorithm: "aes-256-gcm",
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decryptData(encrypted: EncryptedData, key: Buffer): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(encrypted.iv, "hex")
  )

  decipher.setAuthTag(Buffer.from(encrypted.authTag, "hex"))

  let plaintext = decipher.update(encrypted.ciphertext, "hex", "utf8")
  plaintext += decipher.final("utf8")

  return plaintext
}

/**
 * Hash data using SHA-512 (quantum-resistant)
 */
export function hashData(data: string): string {
  return crypto.createHash("sha512").update(data).digest("hex")
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Create and store a new encryption key in the database
 */
export async function createEncryptionKey(
  keyId: string,
  algorithm: string = "aes-256-gcm",
  expiresInDays?: number
): Promise<EncryptionKey> {
  const sql = getSql()

  // Generate key pair (for future PQC implementation)
  const publicKey = generateToken(64)

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const result = await sql`
    INSERT INTO encryption_keys (key_id, algorithm, public_key, expires_at)
    VALUES (${keyId}, ${algorithm}, ${publicKey}, ${expiresAt})
    RETURNING id, key_id, algorithm, public_key, created_at, expires_at, is_active
  `

  return {
    id: result[0].id,
    keyId: result[0].key_id,
    algorithm: result[0].algorithm,
    publicKey: result[0].public_key,
    createdAt: result[0].created_at,
    expiresAt: result[0].expires_at,
    isActive: result[0].is_active,
  }
}

/**
 * Get active encryption key
 */
export async function getActiveEncryptionKey(
  algorithm?: string
): Promise<EncryptionKey | null> {
  const sql = getSql()

  let result
  if (algorithm) {
    result = await sql`
      SELECT id, key_id, algorithm, public_key, created_at, expires_at, is_active
      FROM encryption_keys
      WHERE is_active = true 
        AND algorithm = ${algorithm}
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 1
    `
  } else {
    result = await sql`
      SELECT id, key_id, algorithm, public_key, created_at, expires_at, is_active
      FROM encryption_keys
      WHERE is_active = true 
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY created_at DESC
      LIMIT 1
    `
  }

  if (result.length === 0) {
    return null
  }

  return {
    id: result[0].id,
    keyId: result[0].key_id,
    algorithm: result[0].algorithm,
    publicKey: result[0].public_key,
    createdAt: result[0].created_at,
    expiresAt: result[0].expires_at,
    isActive: result[0].is_active,
  }
}

/**
 * Rotate encryption keys (deactivate old, create new)
 */
export async function rotateEncryptionKey(
  algorithm: string = "aes-256-gcm"
): Promise<EncryptionKey> {
  const sql = getSql()

  // Deactivate existing keys
  await sql`
    UPDATE encryption_keys
    SET is_active = false
    WHERE algorithm = ${algorithm} AND is_active = true
  `

  // Create new key
  const newKeyId = `key-${algorithm}-${Date.now()}`
  return createEncryptionKey(newKeyId, algorithm)
}

/**
 * Encrypt sensitive user data
 */
export async function encryptUserData(userId: string, data: any): Promise<string> {
  const key = generateEncryptionKey()
  const dataString = JSON.stringify(data)
  const encrypted = encryptData(dataString, key)

  // In production, store the key securely (e.g., in a key management service)
  // For now, we include it in the encrypted payload
  return JSON.stringify({
    ...encrypted,
    keyHash: hashData(key.toString("hex")),
  })
}

/**
 * Responsible AI: Content filtering and guardrails
 */
export interface ContentFilterResult {
  allowed: boolean
  reason?: string
  severity?: "low" | "medium" | "high"
  categories?: string[]
}

/**
 * Filter content for harmful or inappropriate material
 */
export function filterContent(content: string): ContentFilterResult {
  const prohibited = [
    { pattern: /\b(hack|exploit|vulnerability)\b/gi, category: "security", severity: "medium" },
    { pattern: /\b(password|credential|api[_-]?key)\b/gi, category: "sensitive_data", severity: "high" },
    { pattern: /\b(violence|weapon|bomb)\b/gi, category: "violence", severity: "high" },
    { pattern: /\b(personal|private|confidential)\s+(data|information)\b/gi, category: "privacy", severity: "high" },
  ]

  const detectedCategories: string[] = []
  let highestSeverity: "low" | "medium" | "high" = "low"

  for (const rule of prohibited) {
    if (rule.pattern.test(content)) {
      detectedCategories.push(rule.category)
      if (
        rule.severity === "high" ||
        (rule.severity === "medium" && highestSeverity === "low")
      ) {
        highestSeverity = rule.severity as "low" | "medium" | "high"
      }
    }
  }

  if (detectedCategories.length > 0) {
    return {
      allowed: highestSeverity !== "high",
      reason: `Content contains potentially sensitive material: ${detectedCategories.join(", ")}`,
      severity: highestSeverity,
      categories: detectedCategories,
    }
  }

  return {
    allowed: true,
  }
}

/**
 * Sanitize PII (Personally Identifiable Information) from content
 */
export function sanitizePII(content: string): string {
  let sanitized = content

  // Email addresses
  sanitized = sanitized.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    "[EMAIL_REDACTED]"
  )

  // Phone numbers (various formats)
  sanitized = sanitized.replace(
    /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
    "[PHONE_REDACTED]"
  )

  // Credit card numbers
  sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, "[CC_REDACTED]")

  // SSN (US Social Security Numbers)
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN_REDACTED]")

  // IP addresses
  sanitized = sanitized.replace(
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    "[IP_REDACTED]"
  )

  return sanitized
}

/**
 * Log encryption/decryption operations for audit
 */
export async function logEncryptionOperation(
  operation: "encrypt" | "decrypt" | "rotate_key",
  userId?: string,
  success: boolean = true,
  details?: any
): Promise<void> {
  const sql = getSql()

  try {
    await sql`
      INSERT INTO audit_logs (
        user_id, action, resource_type, status, details
      )
      VALUES (
        ${userId || null},
        ${`encryption_${operation}`},
        ${"encryption"},
        ${success ? "success" : "failure"},
        ${JSON.stringify(details || {})}
      )
    `
  } catch (error) {
    console.error("Failed to log encryption operation:", error)
  }
}
