import { type NextRequest, NextResponse } from "next/server"
import { createUser, logAuditEvent } from "@/lib/auth"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, organization } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    try {
      // Create user
      const user = await createUser(email, password, name, organization)

      // Log signup event
      await logAuditEvent({
        userId: user.id,
        action: "signup",
        resourceType: "user",
        resourceId: user.id,
        ipAddress,
        userAgent,
        status: "success",
        details: { email, organization },
      })

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organization: user.organization,
        },
      })
    } catch (error: any) {
      // Handle duplicate email
      if (error?.message?.includes("duplicate") || error?.code === "23505") {
        await logAuditEvent({
          action: "signup_failed",
          resourceType: "user",
          ipAddress,
          userAgent,
          status: "failure",
          details: { email, reason: "duplicate_email" },
        })

        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        )
      }

      throw error
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    )
  }
}
