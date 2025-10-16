import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const provider = searchParams.get("provider")

  if (!provider) {
    return NextResponse.json({ error: "Provider required" }, { status: 400 })
  }

  const tokens = request.cookies.get(`${provider}_tokens`)?.value

  return NextResponse.json({
    connected: !!tokens,
    provider,
  })
}

export async function DELETE(request: NextRequest) {
  const { provider } = await request.json()

  if (!provider) {
    return NextResponse.json({ error: "Provider required" }, { status: 400 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(`${provider}_tokens`)
  response.cookies.delete(`${provider}_integration`)

  return response
}
