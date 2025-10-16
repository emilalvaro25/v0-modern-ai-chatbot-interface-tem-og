import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const { provider } = params
  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get("clientId")
  const redirectUrl = searchParams.get("redirectUrl")

  if (!clientId || !redirectUrl) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  let oauthUrl = ""

  switch (provider) {
    case "google":
      oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUrl,
      )}&response_type=code&scope=${encodeURIComponent(
        "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/presentations",
      )}&access_type=offline&prompt=consent`
      break

    case "spotify":
      oauthUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUrl,
      )}&response_type=code&scope=${encodeURIComponent(
        "user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private",
      )}`
      break

    case "slack":
      oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUrl,
      )}&scope=${encodeURIComponent("chat:write channels:read channels:manage files:write")}`
      break

    case "canva":
      oauthUrl = `https://www.canva.com/api/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
        redirectUrl,
      )}&response_type=code&scope=${encodeURIComponent("design:read design:write")}`
      break

    default:
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
  }

  return NextResponse.redirect(oauthUrl)
}
