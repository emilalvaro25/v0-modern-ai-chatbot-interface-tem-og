import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const { provider } = params
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?oauth_error=${error}`)
  }

  if (!code) {
    return NextResponse.redirect(`${request.nextUrl.origin}/?oauth_error=no_code`)
  }

  try {
    const integrationData = request.cookies.get(`${provider}_integration`)?.value
    if (!integrationData) {
      throw new Error("Integration credentials not found")
    }

    const { clientId, clientSecret, redirectUrl } = JSON.parse(integrationData)

    let tokenResponse
    switch (provider) {
      case "google":
        tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUrl,
            grant_type: "authorization_code",
          }),
        })
        break

      case "spotify":
        tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            code,
            redirect_uri: redirectUrl,
            grant_type: "authorization_code",
          }),
        })
        break

      case "slack":
        tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUrl,
          }),
        })
        break

      default:
        throw new Error("Unsupported provider")
    }

    const tokens = await tokenResponse.json()

    const response = NextResponse.redirect(`${request.nextUrl.origin}/?oauth_success=${provider}`)
    response.cookies.set(`${provider}_tokens`, JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    return response
  } catch (error) {
    console.error(`[Eburon] OAuth callback error for ${provider}:`, error)
    return NextResponse.redirect(`${request.nextUrl.origin}/?oauth_error=token_exchange_failed`)
  }
}
