"use client"

import { useState, forwardRef, useImperativeHandle, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Square, Loader2, Search, Code, FileText, CheckCircle2 } from "lucide-react"
import Message from "./Message"
import Composer from "./Composer"
import { MessageContent } from "./MessageContent"
import { cls, timeAgo } from "./utils"

function ToolExecutionIndicator({ tool, status, result }) {
  const icons = {
    web_search: Search,
    analyze_error: Code,
    execute_code: Code,
    read_documentation: FileText,
    validate_code: CheckCircle2,
  }

  const Icon = icons[tool] || Code

  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900 dark:bg-emerald-950">
      <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <span className="text-emerald-700 dark:text-emerald-300">
        {status === "executing" && `Executing ${tool}...`}
        {status === "completed" && `Completed ${tool}`}
      </span>
      {status === "executing" && <Loader2 className="ml-auto h-4 w-4 animate-spin text-emerald-600" />}
      {status === "completed" && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
    </div>
  )
}

function ThinkingMessage({ onPause, currentStep, progress }) {
  return (
    <Message role="assistant">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></div>
          </div>
          <span className="text-sm text-zinc-500">{currentStep || "AI is thinking..."}</span>
          <button
            onClick={onPause}
            className="ml-auto inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Square className="h-3 w-3" /> Pause
          </button>
        </div>
        {progress && <div className="text-xs text-zinc-400">{progress}</div>}
      </div>
    </Message>
  )
}

const ChatPane = forwardRef(function ChatPane(
  {
    conversation,
    onSend,
    onEditMessage,
    onResendMessage,
    isThinking,
    onPauseThinking,
    selectedModel,
    agentMode,
    onAgentModeChange,
  },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [toolExecutions, setToolExecutions] = useState([])
  const [currentStep, setCurrentStep] = useState("")
  const [progress, setProgress] = useState("")
  const composerRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
    }),
    [],
  )

  const isCodingAgent = selectedModel === "qwen3-coder:480b-cloud"
  const isThinkingMode = selectedModel === "gpt-oss:120b-cloud-thinking"
  const tags = isCodingAgent
    ? ["Coding Agent", "Continuous Loop", "Tool-Enabled", "Web Search"]
    : isThinkingMode
      ? ["Thinking Mode", "Deep Reasoning", "Chain-of-Thought", "Analytical"]
      : ["Certified", "Personalized", "Experienced", "Helpful"]

  const messages = conversation ? (Array.isArray(conversation.messages) ? conversation.messages : []) : []
  const count = messages.length || conversation?.messageCount || 0

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 lg:px-8">
        {conversation ? (
          <>
            <div className="mb-2 text-2xl font-serif tracking-tight sm:text-3xl md:text-4xl lg:text-5xl">
              <span className="block leading-[1.05] font-sans text-xl sm:text-2xl">{conversation.title}</span>
            </div>
            <div className="mb-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Updated {timeAgo(conversation.updatedAt)} · {count} messages
            </div>

            <div className="mb-6 flex flex-wrap gap-2 border-b border-zinc-200 pb-5 dark:border-zinc-800">
              {tags.map((t) => (
                <span
                  key={t}
                  className={cls(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs",
                    isCodingAgent || isThinkingMode
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>

            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                {isCodingAgent
                  ? "Ready to code! Ask me to build, debug, or optimize anything. I'll work continuously until it's perfect."
                  : isThinkingMode
                    ? "Thinking mode enabled. I'll show you my reasoning process before providing answers."
                    : "No messages yet. Say hello to start."}
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <div key={m.id} className="space-y-2">
                    {editingId === m.id ? (
                      <div className={cls("rounded-2xl border p-2", "border-zinc-200 dark:border-zinc-800")}>
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="w-full resize-y rounded-xl bg-transparent p-2 text-sm outline-none"
                          rows={3}
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            onClick={saveEdit}
                            className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-white dark:text-zinc-900"
                          >
                            <Check className="h-3.5 w-3.5" /> Save
                          </button>
                          <button
                            onClick={saveAndResend}
                            className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Save & Resend
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Message role={m.role} thinking={m.thinking}>
                        <MessageContent content={m.content} />
                        {m.toolExecutions && m.toolExecutions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {m.toolExecutions.map((tool, idx) => (
                              <ToolExecutionIndicator
                                key={idx}
                                tool={tool.name}
                                status={tool.status}
                                result={tool.result}
                              />
                            ))}
                          </div>
                        )}
                        {m.role === "user" && (
                          <div className="mt-1 flex gap-2 text-[11px] text-zinc-500">
                            <button
                              className="inline-flex items-center gap-1 hover:underline"
                              onClick={() => startEdit(m)}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            <button
                              className="inline-flex items-center gap-1 hover:underline"
                              onClick={() => onResendMessage?.(m.id)}
                            >
                              <RefreshCw className="h-3.5 w-3.5" /> Resend
                            </button>
                          </div>
                        )}
                      </Message>
                    )}
                  </div>
                ))}
                {toolExecutions.length > 0 && (
                  <div className="space-y-2">
                    {toolExecutions.map((tool, idx) => (
                      <ToolExecutionIndicator key={idx} tool={tool.name} status={tool.status} result={tool.result} />
                    ))}
                  </div>
                )}
                {isThinking && (
                  <ThinkingMessage onPause={onPauseThinking} currentStep={currentStep} progress={progress} />
                )}
              </>
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-6 px-4">
            <div className="flex items-center gap-3">
              <img src="/logo-light.png" alt="Eburon AI" className="h-12 w-auto dark:hidden" />
              <img src="/logo-dark.png" alt="Eburon AI" className="hidden h-12 w-auto dark:block" />
            </div>
            <p className="max-w-md text-center text-zinc-600 dark:text-zinc-400">
              Welcome! Create a new chat or select an existing conversation to get started.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className={cls(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs",
                    isCodingAgent || isThinkingMode
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <Composer
        ref={composerRef}
        onSend={async (text) => {
          if (!text.trim()) return
          setBusy(true)
          setToolExecutions([])
          setCurrentStep("")
          setProgress("")
          await onSend?.(text)
          setBusy(false)
        }}
        busy={busy}
        agentMode={agentMode}
        onAgentModeChange={onAgentModeChange}
      />
    </div>
  )
})

export default ChatPane
