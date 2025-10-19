import { type NextRequest, NextResponse } from "next/server"
import { logout } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      )
    }

    // Logout user
    await logout(token)

    // Create response and clear cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    response.cookies.delete("auth_token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "An error occurred during logout" },
      { status: 500 }
    )
  }
}
