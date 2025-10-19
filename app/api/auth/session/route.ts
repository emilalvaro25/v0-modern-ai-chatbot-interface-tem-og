import { type NextRequest, NextResponse } from "next/server"
import { getUserByToken } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      )
    }

    // Get user by token
    const user = await getUserByToken(token)

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organization: user.organization,
      },
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    )
  }
}
