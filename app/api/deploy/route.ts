import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/database"
import { nanoid } from "nanoid"

export const runtime = "edge"

// GET - List all deployments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const publicOnly = searchParams.get("public") === "true"

    const sql = getSql()

    let deployments
    if (userId) {
      deployments = await sql`
        SELECT id, slug, name, language, public, views, created_at, updated_at
        FROM deployments
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `
    } else if (publicOnly) {
      deployments = await sql`
        SELECT id, slug, name, language, public, views, created_at, updated_at
        FROM deployments
        WHERE public = true
        ORDER BY created_at DESC
      `
    } else {
      deployments = await sql`
        SELECT id, slug, name, language, public, views, created_at, updated_at
        FROM deployments
        ORDER BY created_at DESC
        LIMIT 100
      `
    }

    return NextResponse.json({
      success: true,
      deployments,
      count: deployments.length,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch deployments",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// POST - Create new deployment
export async function POST(req: NextRequest) {
  try {
    const { code, slug, name, language, userId, public: isPublic = false } = await req.json()

    if (!code || !name) {
      return NextResponse.json({ error: "Code and name are required" }, { status: 400 })
    }

    // Generate slug if not provided
    const finalSlug = slug || nanoid(10)

    // Validate slug format (alphanumeric and hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(finalSlug)) {
      return NextResponse.json(
        { error: "Invalid slug format. Use only letters, numbers, and hyphens." },
        { status: 400 },
      )
    }

    // Detect language if not provided
    const detectedLanguage = language || detectLanguageFromCode(code)

    const sql = getSql()

    // Check if slug already exists
    const existing = await sql`
      SELECT id FROM deployments WHERE slug = ${finalSlug}
    `

    if (existing.length > 0) {
      return NextResponse.json({ error: "Slug already exists. Please choose a different slug." }, { status: 409 })
    }

    // Create deployment
    const [deployment] = await sql`
      INSERT INTO deployments (slug, name, code, language, user_id, public)
      VALUES (${finalSlug}, ${name}, ${code}, ${detectedLanguage}, ${userId || null}, ${isPublic})
      RETURNING id, slug, name, language, public, views, created_at, updated_at
    `

    return NextResponse.json({
      success: true,
      deployment,
      url: `/slug/${finalSlug}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create deployment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// DELETE - Delete deployment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const slug = searchParams.get("slug")
    const userId = searchParams.get("userId")

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 })
    }

    const sql = getSql()

    // Delete deployment (with user_id check if provided)
    let result
    if (userId) {
      result = await sql`
        DELETE FROM deployments
        WHERE slug = ${slug} AND user_id = ${userId}
        RETURNING id
      `
    } else {
      result = await sql`
        DELETE FROM deployments
        WHERE slug = ${slug}
        RETURNING id
      `
    }

    if (result.length === 0) {
      return NextResponse.json({ error: "Deployment not found or unauthorized" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Deployment deleted successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete deployment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Helper function to detect language from code
function detectLanguageFromCode(code: string): string {
  // Simple heuristics for language detection
  if (code.includes("def ") || code.includes("import ") || code.includes("print(")) {
    return "python"
  }
  if (code.includes("function ") || code.includes("const ") || code.includes("let ") || code.includes("var ")) {
    return "javascript"
  }
  if (code.includes("interface ") || code.includes("type ") || code.includes(": string") || code.includes(": number")) {
    return "typescript"
  }
  if (code.includes("SELECT ") || code.includes("INSERT ") || code.includes("UPDATE ") || code.includes("DELETE ")) {
    return "sql"
  }
  return "javascript" // Default
}
