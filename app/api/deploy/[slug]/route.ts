import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/database"

export const runtime = "edge"

// GET - Get deployment by slug
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params

    const sql = getSql()

    // Increment view count and get deployment
    const [deployment] = await sql`
      UPDATE deployments
      SET views = views + 1
      WHERE slug = ${slug}
      RETURNING id, slug, name, code, language, public, views, created_at, updated_at
    `

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 })
    }

    // Check if deployment is public
    if (!deployment.public) {
      // In production, you'd check authentication here
      // For now, we'll allow access but return a warning
      return NextResponse.json({
        ...deployment,
        warning: "This deployment is private",
      })
    }

    return NextResponse.json({
      success: true,
      deployment,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch deployment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// PUT - Update deployment
export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params
    const { code, name, language, public: isPublic } = await req.json()

    const sql = getSql()

    // Build update query dynamically based on provided fields
    const updates: string[] = []
    const values: any[] = []

    if (code !== undefined) {
      updates.push("code = $" + (values.length + 1))
      values.push(code)
    }
    if (name !== undefined) {
      updates.push("name = $" + (values.length + 1))
      values.push(name)
    }
    if (language !== undefined) {
      updates.push("language = $" + (values.length + 1))
      values.push(language)
    }
    if (isPublic !== undefined) {
      updates.push("public = $" + (values.length + 1))
      values.push(isPublic)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const [deployment] = await sql`
      UPDATE deployments
      SET ${sql(updates.join(", "))}
      WHERE slug = ${slug}
      RETURNING id, slug, name, code, language, public, views, created_at, updated_at
    `

    if (!deployment) {
      return NextResponse.json({ error: "Deployment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      deployment,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update deployment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
