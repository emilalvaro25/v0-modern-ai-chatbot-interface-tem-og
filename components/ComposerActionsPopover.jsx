"use client"
import { useState } from "react"
import { Paperclip, Bot, Search, Palette, BookOpen, MoreHorizontal, Globe, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"
import { cls } from "./utils"

export default function ComposerActionsPopover({ children, agentMode, onAgentModeChange, onFileAttach }) {
  const [open, setOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const mainActions = [
    {
      icon: Paperclip,
      label: "Add photos & files",
      action: () => {
        onFileAttach?.()
        setOpen(false)
      },
      enabled: true,
    },
    {
      icon: Bot,
      label: "Agent mode",
      badge: "NEW",
      action: () => {
        onAgentModeChange?.(!agentMode)
      },
      active: agentMode,
      enabled: true,
    },
    {
      icon: Search,
      label: "Deep research",
      action: () => console.log("Deep research"),
      enabled: false,
      tooltip: "Under Development",
    },
    {
      icon: Palette,
      label: "Create image",
      action: () => console.log("Create image"),
      enabled: false,
      tooltip: "Under Development",
    },
    {
      icon: BookOpen,
      label: "Study and learn",
      action: () => console.log("Study and learn"),
      enabled: false,
      tooltip: "Under Development",
    },
  ]

  const moreActions = [
    {
      icon: Globe,
      label: "Web search",
      action: () => console.log("Web search"),
      enabled: false,
      tooltip: "Under Development",
    },
    {
      icon: Palette,
      label: "Canvas",
      action: () => console.log("Canvas"),
      enabled: false,
      tooltip: "Under Development",
    },
    {
      icon: () => (
        <div className="h-4 w-4 rounded bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>
      ),
      label: "Connect Google Drive",
      action: () => console.log("Connect Google Drive"),
      enabled: false,
      tooltip: "Under Development",
    },
    {
      icon: () => (
        <div className="h-4 w-4 rounded bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>
      ),
      label: "Connect OneDrive",
      action: () => console.log("Connect OneDrive"),
      enabled: false,
      tooltip: "Under Development",
    },
    {
      icon: () => (
        <div className="h-4 w-4 rounded bg-gradient-to-br from-teal-500 to-teal-400 flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>
      ),
      label: "Connect Sharepoint",
      action: () => console.log("Connect Sharepoint"),
      enabled: false,
      tooltip: "Under Development",
    },
  ]

  const handleAction = (action) => {
    if (action.enabled) {
      action.action()
      if (!action.active) {
        setOpen(false)
        setShowMore(false)
      }
    }
  }

  const handleMoreClick = () => {
    setShowMore(true)
  }

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen)
    if (!newOpen) {
      setShowMore(false)
    }
  }

  const renderActionButton = (action, index) => {
    const IconComponent = action.icon
    const button = (
      <button
        key={index}
        onClick={() => handleAction(action)}
        disabled={!action.enabled}
        className={cls(
          "flex items-center gap-3 w-full p-2 text-sm text-left rounded-lg transition-colors",
          action.enabled ? "hover:bg-zinc-100 dark:hover:bg-zinc-800" : "opacity-50 cursor-not-allowed",
          action.active && "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800",
        )}
      >
        {typeof IconComponent === "function" ? <IconComponent /> : <IconComponent className="h-4 w-4" />}
        <span>{action.label}</span>
        {action.badge && (
          <span className="ml-auto px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
            {action.badge}
          </span>
        )}
        {action.active && (
          <svg
            className="h-4 w-4 ml-auto text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
    )

    if (action.tooltip && !action.enabled) {
      return (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent>
              <p>{action.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return button
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start" side="top">
        {!showMore ? (
          <div className="p-3">
            <div className="space-y-1">
              {mainActions.map((action, index) => renderActionButton(action, index))}
              <button
                onClick={handleMoreClick}
                className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span>More</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex">
            <div className="flex-1 p-3 border-r border-zinc-200 dark:border-zinc-800">
              <div className="space-y-1">
                {mainActions.map((action, index) => renderActionButton(action, index))}
                <button
                  onClick={handleMoreClick}
                  className="flex items-center gap-3 w-full p-2 text-sm text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-3">
              <div className="space-y-1">{moreActions.map((action, index) => renderActionButton(action, index))}</div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
