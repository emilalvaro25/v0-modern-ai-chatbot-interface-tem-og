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

  const actualModel = typeof selectedModel === "string" ? selectedModel : selectedModel?.model || "gpt-oss:120b-cloud"
  const isThinkingMode = typeof selectedModel === "object" && selectedModel?.thinking === true

  const isCodingAgent = actualModel === "qwen3-coder:480b-cloud"
  const isDeepSeek = actualModel === "deepseek-v3.1:671b-cloud"
  const is20b = actualModel === "gpt-oss:20b-cloud"

  const modelPresets = {
    "qwen3-coder:480b-cloud": [
      {
        title: "Build Web App",
        description: "Create a full-stack application",
        prompt:
          "Help me build a modern web application with React and Node.js. I need a complete setup with best practices.",
      },
      {
        title: "Debug Code",
        description: "Find and fix code issues",
        prompt: "Help me debug this code and identify potential issues. Provide detailed explanations and solutions.",
      },
      {
        title: "Code Review",
        description: "Review code quality",
        prompt:
          "Please review my code for best practices, performance, security, and maintainability. Suggest improvements.",
      },
      {
        title: "Optimize Performance",
        description: "Improve code efficiency",
        prompt: "Help me optimize this code for better performance. Identify bottlenecks and suggest improvements.",
      },
      {
        title: "Write Tests",
        description: "Create unit and integration tests",
        prompt:
          "Help me write comprehensive tests for my code including unit tests, integration tests, and edge cases.",
      },
      {
        title: "Refactor Code",
        description: "Improve code structure",
        prompt: "Help me refactor this code to be more maintainable, readable, and follow SOLID principles.",
      },
    ],
    "deepseek-v3.1:671b-cloud": [
      {
        title: "Deep Research",
        description: "Comprehensive topic analysis",
        prompt: "Conduct a deep research on this topic with multiple perspectives, sources, and detailed analysis.",
      },
      {
        title: "Compare Solutions",
        description: "Analyze multiple approaches",
        prompt:
          "Compare different solutions to this problem. Analyze pros, cons, trade-offs, and recommend the best approach.",
      },
      {
        title: "Technical Analysis",
        description: "In-depth technical review",
        prompt:
          "Provide a detailed technical analysis including architecture, scalability, security, and best practices.",
      },
      {
        title: "Strategic Planning",
        description: "Long-term strategy development",
        prompt: "Help me develop a strategic plan with goals, milestones, risks, and success metrics.",
      },
    ],
    "gpt-oss:20b-cloud": [
      {
        title: "Quick Summary",
        description: "Summarize content quickly",
        prompt: "Provide a concise summary of this content with key points and main takeaways.",
      },
      {
        title: "Brainstorm Ideas",
        description: "Generate creative ideas",
        prompt:
          "Help me brainstorm creative ideas for this project. Think outside the box and suggest innovative approaches.",
      },
      {
        title: "Quick Answer",
        description: "Fast, direct responses",
        prompt: "Give me a quick, direct answer to this question with essential information only.",
      },
      {
        title: "Simple Explanation",
        description: "Explain concepts simply",
        prompt: "Explain this concept in simple terms that anyone can understand. Use analogies and examples.",
      },
    ],
    "gpt-oss:120b-cloud": [
      {
        title: "Business Document",
        description: "Create professional documents",
        prompt: "Help me create a professional business document with proper formatting and structure.",
      },
      {
        title: "Formal Letter",
        description: "Draft formal letters",
        prompt: "Help me write a formal business letter with appropriate tone and structure.",
      },
      {
        title: "Email Draft",
        description: "Compose professional emails",
        prompt: "Help me draft a professional email for business communication.",
      },
      {
        title: "Quotation",
        description: "Generate price quotations",
        prompt: "Help me create a detailed quotation with itemized pricing and terms.",
      },
      {
        title: "Invoice",
        description: "Create professional invoices",
        prompt: "Help me generate a professional invoice with all necessary details.",
      },
      {
        title: "Creative Writing",
        description: "Write engaging content",
        prompt: "Help me write creative and engaging content that captures attention and tells a compelling story.",
      },
    ],
  }

  const currentPresets = isThinkingMode
    ? modelPresets["gpt-oss:120b-cloud"]
    : modelPresets[actualModel] || modelPresets["gpt-oss:120b-cloud"]

  const handlePresetClick = async (prompt) => {
    if (!prompt.trim() || busy) return
    setBusy(true)
    setToolExecutions([])
    setCurrentStep("")
    setProgress("")
    await onSend?.(prompt)
    setBusy(false)
  }

  const tags = isCodingAgent
    ? ["Coding Agent", "32K Context", "Thinking Mode", "Tool-Enabled"]
    : isThinkingMode
      ? ["Thinking Mode", "Deep Reasoning", "Chain-of-Thought", "Analytical"]
      : isDeepSeek
        ? ["Deep Analysis", "Research", "671B Parameters", "Advanced"]
        : is20b
          ? ["Fast Response", "20B Parameters", "Efficient", "Quick Tasks"]
          : ["Certified", "Personalized", "120B Parameters", "Versatile"]

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
                    isCodingAgent || isThinkingMode || isDeepSeek
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
            <p className="max-w-2xl text-center text-lg sm:text-xl font-medium text-zinc-700 dark:text-zinc-300">
              Welcome to Eburon AI
            </p>
            <p className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400 italic">
              The fire reborn, a presence etched in memory forever.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {tags.map((t) => (
                <span
                  key={t}
                  className={cls(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:px-3 sm:py-1 sm:text-xs",
                    isCodingAgent || isThinkingMode || isDeepSeek
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-200",
                  )}
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="w-full max-w-3xl">
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3 px-2">
                Quick Start Presets
                {isCodingAgent && (
                  <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(Coding Tasks)</span>
                )}
                {isDeepSeek && (
                  <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(Research & Analysis)</span>
                )}
                {is20b && <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(Quick Tasks)</span>}
              </h3>

              {/* Mobile: Pill buttons */}
              <div className="flex md:hidden flex-wrap gap-2 justify-center">
                {currentPresets.map((preset) => (
                  <button
                    key={preset.title}
                    onClick={() => handlePresetClick(preset.prompt)}
                    disabled={busy}
                    className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>

              {/* Desktop: Card grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-3">
                {currentPresets.map((preset) => (
                  <button
                    key={preset.title}
                    onClick={() => handlePresetClick(preset.prompt)}
                    disabled={busy}
                    className="group flex flex-col items-start gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/30"
                  >
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                      {preset.title}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{preset.description}</div>
                  </button>
                ))}
              </div>
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
