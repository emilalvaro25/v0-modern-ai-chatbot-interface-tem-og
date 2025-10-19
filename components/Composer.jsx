"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { Send, Loader2, Plus, Mic, MicOff, Paperclip } from "lucide-react"
import ComposerActionsPopover from "./ComposerActionsPopover"
import { cls } from "./utils"
import { AudioRecorder, transcribeAudio } from "../lib/deepgram"

const Composer = forwardRef(function Composer({ onSend, busy, agentMode, onAgentModeChange }, ref) {
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([])
  const inputRef = useRef(null)
  const recorderRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 20 // Approximate line height in pixels
      const minHeight = 40

      // Reset height to calculate scroll height
      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const calculatedLines = Math.max(1, Math.floor((scrollHeight - 16) / lineHeight)) // 16px for padding

      setLineCount(calculatedLines)

      if (calculatedLines <= 12) {
        // Auto-expand for 1-12 lines
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        // Fixed height with scroll for 12+ lines
        textarea.style.height = `${minHeight + 11 * lineHeight}px` // 12 lines total
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
          setTimeout(() => {
            inputRef.current?.focus()
            const length = newValue.length
            inputRef.current?.setSelectionRange(length, length)
          }, 0)
          return newValue
        })
      },
      submitMessage: () => {
        handleSend()
      },
      focus: () => {
        inputRef.current?.focus()
      },
    }),
    [value, sending], // Add dependencies so handleSend has access to current value
  )

  async function handleSend() {
    if (!value.trim() || sending) return
    setSending(true)
    try {
      await onSend?.(value, agentMode, attachedFiles)
      setValue("")
      setAttachedFiles([])
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  async function handleVoiceInput() {
    if (isRecording) {
      // Stop recording and transcribe
      try {
        setIsTranscribing(true)
        const audioBlob = await recorderRef.current.stopRecording()
        recorderRef.current = null
        setIsRecording(false)

        // Send to server for transcription
        const transcript = await transcribeAudio(audioBlob)

        if (transcript) {
          setValue((prev) => {
            const newValue = prev ? `${prev} ${transcript}` : transcript
            return newValue
          })
        }
      } catch (error) {
        console.error("[v0] Transcription error:", error)
        alert("Failed to transcribe audio. Please try again.")
      } finally {
        setIsTranscribing(false)
      }
    } else {
      // Start recording
      try {
        const recorder = new AudioRecorder()
        recorderRef.current = recorder

        await recorder.startRecording()
        setIsRecording(true)
      } catch (error) {
        console.error("[v0] Failed to start voice input:", error)
        alert("Failed to start voice input. Please check microphone permissions.")
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && isRecording) {
        recorderRef.current.stopRecording().catch(console.error)
      }
    }
  }, [isRecording])

  const hasContent = value.length > 0

  const handleFileAttach = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-zinc-200/60 p-3 sm:p-4 dark:border-zinc-800">
      <div
        className={cls(
          "mx-auto flex flex-col rounded-2xl border bg-white shadow-sm dark:bg-zinc-950 transition-all duration-200",
          "w-full max-w-full sm:max-w-3xl lg:max-w-4xl border-zinc-300 dark:border-zinc-700 p-2 sm:p-3",
        )}
      >
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs"
              >
                <Paperclip className="h-3 w-3" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="How can I help you today?"
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 transition-all duration-200",
              "px-0 py-2 min-h-[40px] text-left",
            )}
            style={{
              height: "auto",
              overflowY: lineCount > 12 ? "auto" : "hidden",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          {isRecording && (
            <div className="absolute bottom-0 left-0 right-0 text-xs text-red-500 italic animate-pulse">
              Recording... Click to stop
            </div>
          )}
          {isTranscribing && (
            <div className="absolute bottom-0 left-0 right-0 text-xs text-blue-500 italic">Transcribing...</div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <ComposerActionsPopover
              agentMode={agentMode}
              onAgentModeChange={onAgentModeChange}
              onFileAttach={handleFileAttach}
            >
              <button
                className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 sm:p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
                title="Add attachment"
              >
                <Plus className="h-4 w-4" />
              </button>
            </ComposerActionsPopover>

            {agentMode && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full shadow-sm">
                <svg className="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Agent
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleVoiceInput}
              disabled={isTranscribing}
              className={cls(
                "inline-flex items-center justify-center rounded-full p-1.5 sm:p-2 transition-colors",
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  : isTranscribing
                    ? "opacity-50 cursor-not-allowed text-zinc-400"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
              )}
              title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Voice input"}
            >
              {isTranscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || busy || !value.trim()}
              className={cls(
                "inline-flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-full bg-zinc-900 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-white dark:text-zinc-900",
                (sending || busy || !value.trim()) && "opacity-50 cursor-not-allowed",
              )}
            >
              {sending || busy ? (
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
        />
      </div>

      <div className="mx-auto mt-2 w-full max-w-full sm:max-w-3xl lg:max-w-4xl px-1 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-400">
        Press{" "}
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Enter
        </kbd>{" "}
        to send ·{" "}
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Shift
        </kbd>
        +
        <kbd className="rounded border border-zinc-300 bg-zinc-50 px-1 dark:border-zinc-600 dark:bg-zinc-800">
          Enter
        </kbd>{" "}
        for newline
      </div>
    </div>
  )
})

export default Composer
