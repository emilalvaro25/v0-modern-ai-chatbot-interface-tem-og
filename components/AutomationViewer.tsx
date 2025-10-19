"use client"

import { useEffect, useState } from "react"
import { MousePointer2, Keyboard, ArrowDown, Camera, Globe } from "lucide-react"

interface Action {
  timestamp: string
  action: string
  details: any
}

interface AutomationViewerProps {
  refreshInterval?: number
}

export default function AutomationViewer({ refreshInterval = 1000 }: AutomationViewerProps) {
  const [actions, setActions] = useState<Action[]>([])
  const [status, setStatus] = useState<any>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/automation?action=status")
        const data = await res.json()
        setStatus(data)
        setActions(data.recentActions || [])
      } catch (error) {
        console.error("Failed to fetch automation status:", error)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshInterval])

  const takeScreenshot = async () => {
    try {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "screenshot" }),
      })
      const data = await res.json()
      if (data.screenshot) {
        setScreenshot(`data:image/png;base64,${data.screenshot}`)
      }
    } catch (error) {
      console.error("Failed to take screenshot:", error)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "click":
        return <MousePointer2 className="h-4 w-4 text-blue-500" />
      case "type":
        return <Keyboard className="h-4 w-4 text-green-500" />
      case "scroll":
        return <ArrowDown className="h-4 w-4 text-purple-500" />
      case "navigate":
        return <Globe className="h-4 w-4 text-orange-500" />
      default:
        return <Camera className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Status Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${status?.browserActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
          />
          <span className="text-sm font-medium">
            {status?.browserActive ? "Browser Active" : "Browser Inactive"}
          </span>
        </div>
        <button
          onClick={takeScreenshot}
          className="flex items-center gap-2 rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
          disabled={!status?.browserActive}
        >
          <Camera className="h-4 w-4" />
          Screenshot
        </button>
      </div>

      {/* Current URL */}
      {status?.currentUrl && (
        <div className="rounded-md bg-zinc-50 p-3 dark:bg-zinc-900">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Current Page</div>
          <div className="mt-1 truncate text-sm font-mono">{status.currentUrl}</div>
        </div>
      )}

      {/* Screenshot Display */}
      {screenshot && (
        <div className="overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
          <img src={screenshot} alt="Browser screenshot" className="w-full" />
        </div>
      )}

      {/* Actions Log */}
      <div className="flex-1 overflow-y-auto">
        <div className="mb-2 text-sm font-semibold">Recent Actions ({actions.length})</div>
        <div className="space-y-2">
          {actions.map((action, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mt-0.5">{getActionIcon(action.action)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">{action.action}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {action.action === "click" && action.details.selector && (
                    <span>Selector: {action.details.selector}</span>
                  )}
                  {action.action === "click" && action.details.x !== undefined && (
                    <span>
                      Position: ({action.details.x}, {action.details.y})
                    </span>
                  )}
                  {action.action === "type" && (
                    <span>
                      Text: "{action.details.text}" into {action.details.selector}
                    </span>
                  )}
                  {action.action === "scroll" && <span>Amount: {action.details.amount}px</span>}
                  {action.action === "navigate" && <span>URL: {action.details.url}</span>}
                </div>
              </div>
            </div>
          ))}
          {actions.length === 0 && (
            <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 py-8">No actions yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
