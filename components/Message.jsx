"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { cls } from "./utils"

export default function Message({ role, children, thinking, content }) {
  const isUser = role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content || children?.toString() || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy:", err)
    }
  }

  return (
    <div className="space-y-2">
      {thinking && !isUser && (
        <div className="flex gap-3 justify-start">
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white">
            E
          </div>
          <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Thinking...
            </div>
            <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70 whitespace-pre-wrap font-mono">
              {thinking}
            </div>
          </div>
        </div>
      )}
      <div className={cls("flex gap-3", isUser ? "justify-end" : "justify-start")}>
        {!isUser && (
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white">
            E
          </div>
        )}
        <div className="relative max-w-[80%] group">
          <div
            className={cls(
              "rounded-2xl px-3 py-2 text-sm shadow-sm",
              isUser
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800",
            )}
          >
            {children}
          </div>
          <button
            onClick={handleCopy}
            className={cls(
              "absolute bottom-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-xs",
              isUser
                ? "left-2 bg-white/90 text-zinc-900 hover:bg-white dark:bg-zinc-900/90 dark:text-white dark:hover:bg-zinc-900"
                : "right-2 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
            )}
            title="Copy message"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
        {isUser && (
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-900">
            U
          </div>
        )}
      </div>
    </div>
  )
}
