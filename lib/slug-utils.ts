import { nanoid } from "nanoid"

export function generateSlug(length = 10): string {
  return nanoid(length)
}

export function validateSlug(slug: string): { valid: boolean; error?: string } {
  // Check length
  if (slug.length < 3) {
    return { valid: false, error: "Slug must be at least 3 characters long" }
  }

  if (slug.length > 50) {
    return { valid: false, error: "Slug must be at most 50 characters long" }
  }

  // Check format (alphanumeric and hyphens only)
  if (!/^[a-zA-Z0-9-]+$/.test(slug)) {
    return { valid: false, error: "Slug can only contain letters, numbers, and hyphens" }
  }

  // Check that it doesn't start or end with hyphen
  if (slug.startsWith("-") || slug.endsWith("-")) {
    return { valid: false, error: "Slug cannot start or end with a hyphen" }
  }

  // Check for consecutive hyphens
  if (slug.includes("--")) {
    return { valid: false, error: "Slug cannot contain consecutive hyphens" }
  }

  // Reserved slugs
  const reserved = ["api", "admin", "dashboard", "settings", "profile", "login", "signup", "logout", "slug"]
  if (reserved.includes(slug.toLowerCase())) {
    return { valid: false, error: "This slug is reserved and cannot be used" }
  }

  return { valid: true }
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/--+/g, "-") // Replace consecutive hyphens with single hyphen
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
    .substring(0, 50) // Limit length
}
