import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@deepgram/sdk"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  try {
    // Get user from headers (added by middleware)
    const userId = req.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const audioFile = formData.get("audio") as Blob

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      )
    }

    // Check if Eburon STT is configured
    const eburonSTTKey = process.env.EBURON_STT_KEY || process.env.DEEPGRAM_API_KEY

    if (!eburonSTTKey) {
      // Fallback: Use Web Speech API on client side
      // For now, return mock transcription
      return NextResponse.json({
        transcript: "Eburon STT service not configured. Please add EBURON_STT_KEY to environment variables.",
        duration_ms: 0,
        language: "en-US",
      })
    }

    try {
      // Initialize Eburon STT client
      const deepgram = createClient(eburonSTTKey)

      // Convert blob to buffer
      const audioBuffer = await audioFile.arrayBuffer()

      // Transcribe audio using Deepgram
      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        Buffer.from(audioBuffer),
        {
          model: "nova-2",
          smart_format: true,
          language: "en-US",
        }
      )

      if (error) {
        console.error("[Eburon STT] Transcription error:", error)
        return NextResponse.json(
          { error: "Eburon STT service error. Please try again." },
          { status: 500 }
        )
      }

      const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || ""
      const duration_ms = result.metadata?.duration ? result.metadata.duration * 1000 : 0

      // Save voice session to database
      const sql = (await import("@/lib/database")).getSql()
      await sql`
        INSERT INTO voice_sessions (user_id, transcript, duration_ms, language)
        VALUES (${userId}, ${transcript}, ${duration_ms}, 'en-US')
      `

      return NextResponse.json({
        transcript,
        duration_ms,
        language: "en-US",
      })
    } catch (error) {
      console.error("[Eburon STT] Service error:", error)
      return NextResponse.json(
        { error: "Eburon STT service temporarily unavailable" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[Eburon Voice] Processing error:", error)
    return NextResponse.json(
      { error: "Voice processing error. Please try again." },
      { status: 500 }
    )
  }
}
