"use client"

import { useState } from "react"
import { Monitor, Tablet, Smartphone, X } from "lucide-react"

export function LivePreview({ code, language }) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState("web") // web, tablet, phone

  // Check if code is previewable (HTML, CSS, JS, or combined)
  const isPreviewable =
    language === "html" ||
    language === "css" ||
    language === "javascript" ||
    language === "jsx" ||
    code.includes("<html") ||
    code.includes("<!DOCTYPE")

  if (!isPreviewable) return null

  const getFrameWidth = () => {
    switch (viewMode) {
      case "phone":
        return "375px"
      case "tablet":
        return "768px"
      default:
        return "100%"
    }
  }

  const createPreviewHTML = () => {
    try {
      // If it's already HTML, use it directly
      if (code.includes("<html") || code.includes("<!DOCTYPE")) {
        return code
      }

      // For React/JSX code, show a message
      if (language === "jsx" || language === "tsx" || code.includes("import React")) {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      margin: 0; 
      padding: 40px; 
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .message {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      max-width: 500px;
      text-align: center;
    }
    h2 { color: #667eea; margin-top: 0; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="message">
    <h2>React/JSX Preview</h2>
    <p>This is React/JSX code. To see it rendered, it needs to be compiled and run in a React environment.</p>
    <p>The code is valid and ready to use in your React application!</p>
  </div>
</body>
</html>
        `
      }

      // Otherwise, wrap it in a basic HTML structure
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
    * { box-sizing: border-box; }
  </style>
  ${language === "css" ? `<style>${code}</style>` : ""}
</head>
<body>
  ${language === "html" ? code : ""}
  ${language === "javascript" ? `<script>${code}</script>` : ""}
</body>
</html>
      `
    } catch (error) {
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      margin: 0; 
      padding: 40px; 
      font-family: monospace;
      background: #fee;
      color: #c00;
    }
  </style>
</head>
<body>
  <h2>Preview Error</h2>
  <p>Unable to generate preview: ${error instanceof Error ? error.message : "Unknown error"}</p>
</body>
</html>
      `
    }
  }

  return (
    <>
      {/* Preview Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-2 right-2 flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400"
        title="Live Preview"
      >
        <Monitor className="h-3.5 w-3.5" />
        Preview
      </button>

      {/* Preview Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative flex h-full w-full max-w-7xl flex-col rounded-xl bg-white shadow-2xl dark:bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-lg font-semibold text-transparent">
                  Live Preview
                </div>
              </div>

              {/* View Mode Selector */}
              <div className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                <button
                  onClick={() => setViewMode("web")}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "web"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("tablet")}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "tablet"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                  title="Tablet View"
                >
                  <Tablet className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("phone")}
                  className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === "phone"
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Preview Frame */}
            <div className="flex flex-1 items-center justify-center overflow-auto bg-zinc-50 p-8 dark:bg-zinc-950">
              <div
                className="h-full bg-white shadow-xl transition-all duration-300 dark:bg-zinc-900"
                style={{ width: getFrameWidth(), maxWidth: "100%" }}
              >
                <iframe
                  srcDoc={createPreviewHTML()}
                  className="h-full w-full border-0"
                  sandbox="allow-scripts allow-same-origin"
                  title="Live Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
