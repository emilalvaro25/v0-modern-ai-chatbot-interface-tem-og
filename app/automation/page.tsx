"use client"

import { useState } from "react"
import AutomationViewer from "@/components/AutomationViewer"
import { Play, Square, RotateCw } from "lucide-react"

const EBURON_MODELS = [
  "gpt-oss:120b-cloud",
  "gpt-oss:20b-cloud",
  "deepseek-v3.1:671b-cloud",
  "qwen3-coder:480b-cloud",
  "glm-4.6:cloud",
  "llama-3.3:70b-cloud",
  "mistral-large:123b-cloud",
  "phi-4:14b-cloud",
]

export default function AutomationDemo() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentModel, setCurrentModel] = useState(EBURON_MODELS[0])
  const [autoSwap, setAutoSwap] = useState(true)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`].slice(-50))
  }

  const executeAction = async (action: string, params: any = {}) => {
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...params }),
      })
      const data = await res.json()
      addLog(`✓ ${data.message || `Action ${action} completed`}`)
      return data
    } catch (error: any) {
      addLog(`✗ Error: ${error.message}`)
      throw error
    }
  }

  const swapModel = () => {
    const currentIndex = EBURON_MODELS.indexOf(currentModel)
    const nextIndex = (currentIndex + 1) % EBURON_MODELS.length
    const nextModel = EBURON_MODELS[nextIndex]
    setCurrentModel(nextModel)
    addLog(`🔄 Switched to model: ${nextModel}`)
    return nextModel
  }

  const runSimulation = async () => {
    setIsRunning(true)
    addLog("🚀 Starting Eburon Automation Simulation")

    try {
      // Step 1: Navigate to Google
      addLog(`📡 Using model: ${currentModel}`)
      await executeAction("navigate", { url: "https://www.google.com" })
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Step 2: Type search query
      if (autoSwap) swapModel()
      await executeAction("type", { selector: 'textarea[name="q"]', text: "Eburon AI chatbot" })
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Step 3: Click search button
      if (autoSwap) swapModel()
      await executeAction("click", { selector: 'input[type="submit"]' })
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Step 4: Take screenshot
      if (autoSwap) swapModel()
      await executeAction("screenshot")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Step 5: Scroll down
      if (autoSwap) swapModel()
      await executeAction("scroll", { scrollAmount: 500 })
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Step 6: Navigate to GitHub
      if (autoSwap) swapModel()
      await executeAction("navigate", { url: "https://github.com" })
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Step 7: Take final screenshot
      if (autoSwap) swapModel()
      await executeAction("screenshot")

      addLog("✅ Simulation completed successfully!")
    } catch (error: any) {
      addLog(`❌ Simulation failed: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const stopSimulation = async () => {
    setIsRunning(false)
    await executeAction("close")
    addLog("⏹️ Simulation stopped and browser closed")
  }

  const resetSimulation = () => {
    setLogs([])
    setCurrentModel(EBURON_MODELS[0])
    addLog("🔄 Simulation reset")
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-2xl font-bold">Eburon Browser Automation</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          AI-powered browser automation with model auto-swapping
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Control Panel */}
        <div className="flex w-96 flex-col gap-4">
          {/* Model Selector */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-sm font-semibold">Current Model</h3>
            <div className="rounded-md bg-emerald-50 p-3 dark:bg-emerald-950">
              <div className="font-mono text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {currentModel}
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoSwap}
                  onChange={(e) => setAutoSwap(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Auto-swap models between actions</span>
              </label>
            </div>
          </div>

          {/* Controls */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="mb-3 text-sm font-semibold">Controls</h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={runSimulation}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {isRunning ? "Running..." : "Start Simulation"}
              </button>

              <button
                onClick={stopSimulation}
                disabled={!isRunning}
                className="flex items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600 disabled:opacity-50"
              >
                <Square className="h-4 w-4" />
                Stop & Close Browser
              </button>

              <button
                onClick={resetSimulation}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                <RotateCw className="h-4 w-4" />
                Reset
              </button>

              <button
                onClick={swapModel}
                disabled={isRunning}
                className="flex items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 disabled:opacity-50"
              >
                🔄 Manual Model Swap
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
              <h3 className="text-sm font-semibold">Activity Log</h3>
            </div>
            <div className="h-full overflow-y-auto p-3">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log, idx) => (
                  <div
                    key={idx}
                    className="text-zinc-700 dark:text-zinc-300"
                  >
                    {log}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-center text-zinc-500 dark:text-zinc-400">
                    No activity yet. Start a simulation!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Automation Viewer */}
        <div className="flex-1 overflow-hidden">
          <AutomationViewer refreshInterval={500} />
        </div>
      </div>
    </div>
  )
}
