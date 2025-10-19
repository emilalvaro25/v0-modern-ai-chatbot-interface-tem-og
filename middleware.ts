import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getUserByToken } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // EY-specific route protection
  if (pathname.startsWith("/ey/demo")) {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      // Redirect to login with return URL
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("returnTo", pathname)
      return NextResponse.redirect(url)
    }

    try {
      const user = await getUserByToken(token)

      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        url.searchParams.set("returnTo", pathname)
        return NextResponse.redirect(url)
      }

      // Check if user is EY tester or admin
      if (user.role !== "ey_tester" && user.role !== "admin") {
        const url = request.nextUrl.clone()
        url.pathname = "/unauthorized"
        return NextResponse.redirect(url)
      }

      // Add user info to headers for downstream use
      const response = NextResponse.next()
      response.headers.set("x-user-id", user.id)
      response.headers.set("x-user-role", user.role)
      response.headers.set("x-user-email", user.email)
      return response
    } catch (error) {
      console.error("Middleware auth error:", error)
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("returnTo", pathname)
      return NextResponse.redirect(url)
    }
  }

  // Protected API routes
  if (pathname.startsWith("/api/voice") || pathname.startsWith("/api/benchmarks")) {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    try {
      const user = await getUserByToken(token)

      if (!user) {
        return NextResponse.json(
          { error: "Invalid or expired session" },
          { status: 401 }
        )
      }

      // Add user info to headers
      const response = NextResponse.next()
      response.headers.set("x-user-id", user.id)
      response.headers.set("x-user-role", user.role)
      return response
    } catch (error) {
      console.error("API middleware auth error:", error)
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/ey/:path*",
    "/api/voice/:path*",
    "/api/benchmarks/:path*",
  ],
}
