import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@deepgram/sdk"

export const runtime = "nodejs"

// POST - Stream audio for transcription
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Deepgram API key not configured" }, { status: 500 })
    }

    const formData = await req.formData()
    const audioBlob = formData.get("audio") as Blob

    if (!audioBlob) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 })
    }

    const deepgram = createClient(apiKey)

    // Convert blob to buffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Transcribe audio
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(buffer, {
      model: "nova-2",
      language: "en-US",
      smart_format: true,
      punctuate: true,
    })

    if (error) {
      console.error("[v0] Deepgram transcription error:", error)
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
    }

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error("[v0] Error in transcription route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
