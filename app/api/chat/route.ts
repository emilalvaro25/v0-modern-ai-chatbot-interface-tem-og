import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getSystemPrompt } from "@/lib/system-prompt"
import { CODING_AGENT_SYSTEM_PROMPT } from "@/lib/coding-agent-prompt"
import { EBURON_TOOLS, executeTool } from "@/lib/tools"
import { buildAIMemory, generateMemorySummary } from "@/lib/memory"
import { fetchWithFallback, ERROR_MESSAGES } from "@/lib/api-config"

export const runtime = "edge"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  try {
    const { messages, model, conversationId, userId, enableTools = true, enableThinking = false } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 })
    }

    let memoryContext = ""
    if (userId) {
      const memory = await buildAIMemory(userId, conversationId)
      memoryContext = generateMemorySummary(memory)
    }

    const isCodingAgent = model === "qwen3-coder:480b-cloud"
    const baseSystemPrompt = isCodingAgent ? CODING_AGENT_SYSTEM_PROMPT : getSystemPrompt()
    const systemPrompt = baseSystemPrompt + memoryContext
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

    if (model === "qwen3-coder:480b-cloud") {
      requestBody.options = {
        num_ctx: 32768,
      }
      requestBody.think = true
    }

    if (enableThinking) {
      requestBody.think = true
    }

    if (enableTools) {
      requestBody.tools = EBURON_TOOLS
    }

    let response: Response
    try {
      response = await fetchWithFallback("/api/chat", {
        method: "POST",
        body: JSON.stringify(requestBody),
      })
    } catch (error) {
      console.error("[System] All endpoints failed:", error)
      return NextResponse.json({ error: ERROR_MESSAGES.AI_UNAVAILABLE }, { status: 503 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: ERROR_MESSAGES.AI_UNAVAILABLE }, { status: response.status })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    let fullAssistantMessage = ""
    let buffer = ""

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
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "tool_call",
                          tool: toolCall.function.name,
                          args: toolCall.function.arguments,
                        })}\n\n`,
                      ),
                    )

                    const toolResult = await executeTool(toolCall.function.name, toolCall.function.arguments)

                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "tool_result",
                          tool: toolCall.function.name,
                          result: toolResult,
                        })}\n\n`,
                      ),
                    )

                    messagesWithSystem.push({
                      role: "tool",
                      name: toolCall.function.name,
                      content: JSON.stringify(toolResult),
                    })

                    const followUpResponse = await fetchWithFallback("/api/chat", {
                      method: "POST",
                      body: JSON.stringify({
                        model: model || "gpt-oss:120b-cloud",
                        messages: messagesWithSystem,
                        stream: true,
                        tools: enableTools ? EBURON_TOOLS : undefined,
                      }),
                    })

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
                // Silently ignore JSON parse errors
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
              // Silently ignore final buffer parse errors
            }
          }
        } catch (error) {
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
    return NextResponse.json({ error: ERROR_MESSAGES.GENERIC }, { status: 500 })
  }
}
