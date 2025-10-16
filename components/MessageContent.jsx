"use client"

import { CodeBlock } from "./CodeBlock"

export function MessageContent({ content }) {
  // Parse content to detect code blocks
  const parseContent = (text) => {
    const parts = []
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let lastIndex = 0
    let match

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        })
      }

      // Add code block
      parts.push({
        type: "code",
        language: match[1] || "",
        content: match[2].trim(),
      })

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      })
    }

    return parts.length > 0 ? parts : [{ type: "text", content: text }]
  }

  const parts = parseContent(content)

  return (
    <div>
      {parts.map((part, index) => {
        if (part.type === "code") {
          return <CodeBlock key={index} code={part.content} language={part.language} />
        }
        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.content}
          </div>
        )
      })}
    </div>
  )
}
