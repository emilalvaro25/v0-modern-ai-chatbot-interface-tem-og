"use client"
import { MoreHorizontal, Menu, ChevronDown, Wrench, Plug, Settings } from "lucide-react"
import { useState } from "react"
import GhostIconButton from "./GhostIconButton"
import ServerSettingsModal from "./ServerSettingsModal"

export default function Header({
  createNewChat,
  sidebarCollapsed,
  setSidebarOpen,
  sidebarOpen,
  selectedModel,
  onModelChange,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showServerSettings, setShowServerSettings] = useState(false)
  const [showToolsMenu, setShowToolsMenu] = useState(false)
  const [showIntegrationsMenu, setShowIntegrationsMenu] = useState(false)

  const ollamaModels = [
    { name: "gpt-oss:120b-cloud", label: "Emilio-120b", icon: "🚀", thinking: false },
    { name: "gpt-oss:120b-cloud", label: "Emilio-120b-Thinking", icon: "🧠", thinking: true },
    { name: "gpt-oss:20b-cloud", label: "Emilio-flash-20b", icon: "⚡", thinking: false },
    { name: "deepseek-v3.1:671b-cloud", label: "Aquilles-V3.1", icon: "🎯", thinking: false },
    { name: "qwen3-coder:480b-cloud", label: "Alex-Coder", icon: "💻", thinking: true, context: "32K" },
  ]

  const currentModel =
    ollamaModels.find((m) => {
      if (typeof selectedModel === "string") {
        return m.name === selectedModel && !m.thinking
      }
      return m.name === selectedModel.model && m.thinking === selectedModel.thinking
    }) || ollamaModels[0]

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        {(!sidebarOpen || sidebarCollapsed) && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-1.5 sm:p-2 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        <div className="flex relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-zinc-200 bg-white px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold tracking-tight hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800"
          >
            <span className="text-xs sm:text-sm">{currentModel.icon}</span>
            <span className="hidden sm:inline">{currentModel.label}</span>
            <span className="sm:hidden">{currentModel.label.split("-")[0]}</span>
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40 md:hidden" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 w-48 sm:w-56 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50">
                {ollamaModels.map((model, idx) => {
                  const modelKey = `${model.name}-${model.thinking ? "thinking" : "normal"}`
                  const isSelected =
                    typeof selectedModel === "string"
                      ? selectedModel === model.name && !model.thinking
                      : selectedModel.model === model.name && selectedModel.thinking === model.thinking

                  return (
                    <button
                      key={modelKey}
                      onClick={() => {
                        onModelChange?.(model.thinking ? { model: model.name, thinking: true } : model.name)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className="text-xs sm:text-sm">{model.icon}</span>
                      <span className="flex-1">{model.label}</span>
                      {isSelected && <span className="text-xs text-emerald-600 dark:text-emerald-400">✓</span>}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Tools"
          >
            <Wrench className="h-4 w-4" />
            <span className="hidden md:inline">Tools</span>
          </button>

          <button
            onClick={() => setShowIntegrationsMenu(!showIntegrationsMenu)}
            className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Integrations"
          >
            <Plug className="h-4 w-4" />
            <span className="hidden md:inline">Integrations</span>
          </button>

          <button
            onClick={() => setShowServerSettings(true)}
            className="inline-flex items-center gap-2 rounded-lg px-2 sm:px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            title="Server Settings"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden lg:inline">Settings</span>
          </button>

          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
        </div>
      </div>

      <ServerSettingsModal isOpen={showServerSettings} onClose={() => setShowServerSettings(false)} />

      {showToolsMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowToolsMenu(false)} />
          <div className="fixed right-4 top-16 z-50 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">ENABLED TOOLS</p>
              <button
                onClick={() => {
                  setShowToolsMenu(false)
                  setShowServerSettings(true)
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Manage tools in Server Settings
              </button>
            </div>
          </div>
        </>
      )}

      {showIntegrationsMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowIntegrationsMenu(false)} />
          <div className="fixed right-4 top-16 z-50 w-64 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">INTEGRATIONS</p>
              <button
                onClick={() => {
                  setShowIntegrationsMenu(false)
                  setShowServerSettings(true)
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Configure integrations in Server Settings
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
