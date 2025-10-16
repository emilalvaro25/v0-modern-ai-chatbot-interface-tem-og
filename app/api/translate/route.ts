import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang, sourceLang = "en" } = await req.json()

    // Construct the translation URL using Google Translate's free service
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    })

    if (!response.ok) {
      throw new Error("Translation request failed")
    }

    const data = await response.json()

    // Parse the response - Google Translate free API returns nested arrays
    // Format: [[[translated_text, original_text, null, null, 10]], null, source_lang]
    let translatedText = ""
    if (data && data[0]) {
      translatedText = data[0].map((item: any) => item[0]).join("")
    }

    return NextResponse.json({ translatedText: translatedText || text })
  } catch (error) {
    console.error("[v0] Translation error:", error)
    const { text } = await req.json()
    return NextResponse.json({ error: "Translation failed", translatedText: text }, { status: 500 })
  }
}
