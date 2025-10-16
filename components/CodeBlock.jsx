"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { LivePreview } from "./LivePreview"

export function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy code:", err)
    }
  }

  // Language display name mapping
  const languageNames = {
    js: "JavaScript",
    jsx: "React",
    ts: "TypeScript",
    tsx: "React TypeScript",
    py: "Python",
    python: "Python",
    html: "HTML",
    css: "CSS",
    json: "JSON",
    md: "Markdown",
    bash: "Bash",
    sh: "Shell",
    sql: "SQL",
  }

  const displayLanguage = languageNames[language] || language || "Code"

  return (
    <div className="group relative my-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{displayLanguage}</span>
        <div className="flex items-center gap-2">
          <LivePreview code={code} language={language} />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed">
          <code className="font-mono text-zinc-800 dark:text-zinc-200">{code}</code>
        </pre>
      </div>
    </div>
  )
}
