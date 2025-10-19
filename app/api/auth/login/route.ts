import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser, logAuditEvent } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const userAgent = req.headers.get("user-agent") || "unknown"

    // Authenticate user
    const result = await authenticateUser(email, password, ipAddress, userAgent)

    if (!result) {
      // Log failed login attempt
      await logAuditEvent({
        action: "login_failed",
        resourceType: "auth",
        ipAddress,
        userAgent,
        status: "failure",
        details: { email },
      })

      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const { user, token } = result

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
      token,
    })

    // Set HTTP-only cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    )
  }
}
