import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSystemPrompt } from "@/lib/system-prompt"
import { CODING_AGENT_SYSTEM_PROMPT } from "@/lib/coding-agent-prompt"
import { EBURON_TOOLS, executeTool } from "@/lib/tools"

export const runtime = "edge"

const OLLAMA_API_URL = "https://ollama.com/api"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const { messages, model, conversationId, userId, enableTools = true, enableThinking = false } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    const apiKey = process.env.OLLAMA_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "OLLAMA_API_KEY environment variable is not set" }, { status: 500 })
    }

    const isCodingAgent = model === "qwen3-coder:480b-cloud"
    const systemPrompt = isCodingAgent ? CODING_AGENT_SYSTEM_PROMPT : getSystemPrompt()
    const messagesWithSystem = [{ role: "system", content: systemPrompt }, ...messages]

    if (conversationId && userId) {
      const userMessage = messages[messages.length - 1]
      if (userMessage && userMessage.role === "user") {
        await sql`
          INSERT INTO messages (conversation_id, role, content)
          VALUES (${conversationId}, 'user', ${userMessage.content})
        `
      }
    }

    const requestBody: any = {
      model: model || "gpt-oss:120b-cloud",
      messages: messagesWithSystem,
      stream: true,
    }

    if (enableThinking) {
      requestBody.think = true
    }

    if (enableTools) {
      requestBody.tools = EBURON_TOOLS
    }

    const response = await fetch(`${OLLAMA_API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Ollama API error:", errorText)
      return NextResponse.json({ error: `Ollama API error: ${response.statusText}` }, { status: response.status })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullAssistantMessage = ""
    let buffer = ""
    const toolCalls: any[] = []
    const currentToolCall: any = null

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            buffer += chunk

            const lines = buffer.split("\n")
            buffer = lines.pop() || ""

            for (const line of lines) {
              const trimmedLine = line.trim()
              if (!trimmedLine) continue

              try {
                const json = JSON.parse(trimmedLine)

                if (json.message?.tool_calls) {
                  for (const toolCall of json.message.tool_calls) {
                    console.log("[v0] Tool call detected:", toolCall.function.name)

                    // Send tool call notification to client
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "tool_call",
                          tool: toolCall.function.name,
                          args: toolCall.function.arguments,
                        })}\n\n`,
                      ),
                    )

                    // Execute tool
                    const toolResult = await executeTool(toolCall.function.name, toolCall.function.arguments)

                    console.log("[v0] Tool result:", toolResult)

                    // Send tool result to client
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "tool_result",
                          tool: toolCall.function.name,
                          result: toolResult,
                        })}\n\n`,
                      ),
                    )

                    // Add tool result to messages and continue conversation
                    messagesWithSystem.push({
                      role: "tool",
                      name: toolCall.function.name,
                      content: JSON.stringify(toolResult),
                    })

                    // Make another API call with tool results
                    const followUpResponse = await fetch(`${OLLAMA_API_URL}/chat`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                      },
                      body: JSON.stringify({
                        model: model || "gpt-oss:120b-cloud",
                        messages: messagesWithSystem,
                        stream: true,
                        tools: enableTools ? EBURON_TOOLS : undefined,
                      }),
                    })

                    // Stream the follow-up response
                    const followUpReader = followUpResponse.body?.getReader()
                    if (followUpReader) {
                      let followUpBuffer = ""
                      while (true) {
                        const { done: followUpDone, value: followUpValue } = await followUpReader.read()
                        if (followUpDone) break

                        const followUpChunk = decoder.decode(followUpValue, { stream: true })
                        followUpBuffer += followUpChunk

                        const followUpLines = followUpBuffer.split("\n")
                        followUpBuffer = followUpLines.pop() || ""

                        for (const followUpLine of followUpLines) {
                          const trimmedFollowUpLine = followUpLine.trim()
                          if (!trimmedFollowUpLine) continue

                          try {
                            const followUpJson = JSON.parse(trimmedFollowUpLine)
                            if (followUpJson.message?.content) {
                              fullAssistantMessage += followUpJson.message.content
                              controller.enqueue(encoder.encode(`data: ${JSON.stringify(followUpJson)}\n\n`))
                            }
                          } catch (e) {
                            // Ignore parse errors
                          }
                        }
                      }
                    }
                  }
                }

                if (json.message?.content) {
                  fullAssistantMessage += json.message.content
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(json)}\n\n`))
                }

                if (json.message?.thinking) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(json)}\n\n`))
                }

                if (json.done) {
                  if (conversationId && fullAssistantMessage) {
                    await sql`
                      INSERT INTO messages (conversation_id, role, content)
                      VALUES (${conversationId}, 'assistant', ${fullAssistantMessage})
                    `

                    await sql`
                      UPDATE conversations 
                      SET updated_at = NOW()
                      WHERE id = ${conversationId}
                    `
                  }
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                }
              } catch (e) {
                if (trimmedLine) {
                  console.error("[v0] Error parsing JSON line:", trimmedLine.substring(0, 100), e)
                }
              }
            }
          }

          if (buffer.trim()) {
            try {
              const json = JSON.parse(buffer.trim())
              if (json.message?.content) {
                fullAssistantMessage += json.message.content
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(json)}\n\n`))
              }
              if (json.done) {
                if (conversationId && fullAssistantMessage) {
                  await sql`
                    INSERT INTO messages (conversation_id, role, content)
                    VALUES (${conversationId}, 'assistant', ${fullAssistantMessage})
                  `
                  await sql`
                    UPDATE conversations 
                    SET updated_at = NOW()
                    WHERE id = ${conversationId}
                  `
                }
                controller.enqueue(encoder.encode("data: [DONE]\n\n"))
              }
            } catch (e) {
              console.error("[v0] Error parsing final buffer:", buffer.substring(0, 100), e)
            }
          }
        } catch (error) {
          console.error("[v0] Stream error:", error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] API route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
