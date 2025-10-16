"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import GhostIconButton from "./GhostIconButton"
import ThemeToggle from "./ThemeToggle"

export default function AIAssistantUI() {
  const [userId] = useState(() => {
    if (typeof window === "undefined") return null
    let id = localStorage.getItem("eburon-user-id")
    if (!id) {
      id = `user-${Math.random().toString(36).slice(2)}`
      localStorage.setItem("eburon-user-id", id)
    }
    return id
  })

  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" && localStorage.getItem("theme")
    if (saved) return saved
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      return "dark"
    return "light"
  })

  useEffect(() => {
    try {
      if (theme === "dark") document.documentElement.classList.add("dark")
      else document.documentElement.classList.remove("dark")
      document.documentElement.setAttribute("data-theme", theme)
      document.documentElement.style.colorScheme = theme
      localStorage.setItem("theme", theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    try {
      const media = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)")
      if (!media) return
      const listener = (e) => {
        const saved = localStorage.getItem("theme")
        if (!saved) setTheme(e.matches ? "dark" : "light")
      }
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    } catch {}
  }, [])

  const [selectedModel, setSelectedModel] = useState("gpt-oss:120b-cloud")

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      return raw ? JSON.parse(raw) : { pinned: true, recent: false, folders: true, templates: true }
    } catch {
      return { pinned: true, recent: false, folders: true, templates: true }
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      return saved ? JSON.parse(saved) : false
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed])

  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState([])
  const [folders, setFolders] = useState([
    { id: "f1", name: "Work Projects" },
    { id: "f2", name: "Personal" },
    { id: "f3", name: "Code Reviews" },
  ])

  const [isLoadingConversations, setIsLoadingConversations] = useState(false)

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)

  useEffect(() => {
    if (!userId) return
    loadConversations()
  }, [userId])

  async function loadConversations() {
    if (!userId) return
    setIsLoadingConversations(true)
    try {
      const response = await fetch(`/api/conversations?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.conversations && data.conversations.length > 0) {
          const formattedConvs = data.conversations.map((c) => ({
            id: c.id,
            title: c.title,
            updatedAt: c.updated_at,
            messageCount: 0,
            preview: "Loading messages...",
            pinned: false,
            folder: "Work Projects",
            messages: [],
            model: c.model,
          }))
          setConversations(formattedConvs)
        }
      }
    } catch (error) {
      console.error("[v0] Error loading conversations:", error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  useEffect(() => {
    if (!selectedId) return
    loadMessages(selectedId)
  }, [selectedId])

  async function loadMessages(convId) {
    try {
      const response = await fetch(`/api/messages?conversationId=${convId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.messages) {
          const formattedMsgs = data.messages
            .filter((m) => m.role !== "system")
            .map((m) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.created_at,
            }))

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c
              return {
                ...c,
                messages: formattedMsgs,
                messageCount: formattedMsgs.length,
                preview: formattedMsgs[formattedMsgs.length - 1]?.content?.slice(0, 80) || "Start chatting...",
              }
            }),
          )
        }
      }
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
    }
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const pinned = filtered.filter((c) => c.pinned).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
    return map
  }, [conversations, folders])

  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  async function createNewChat() {
    if (!userId) return

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: "New Chat",
          model: selectedModel,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const conv = data.conversation
        const item = {
          id: conv.id,
          title: conv.title,
          updatedAt: conv.updated_at,
          messageCount: 0,
          preview: "Say hello to start...",
          pinned: false,
          folder: "Work Projects",
          messages: [],
          model: conv.model,
        }
        setConversations((prev) => [item, ...prev])
        setSelectedId(conv.id)
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error("[v0] Error creating conversation:", error)
    }
  }

  function createFolder() {
    const name = prompt("Folder name")
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert("Folder already exists.")
    setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }])
  }

  async function sendMessage(convId, content) {
    if (!content.trim()) return
    const now = new Date().toISOString()
    const userMsg = { id: Math.random().toString(36).slice(2), role: "user", content, createdAt: now }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), userMsg]
        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview: content.slice(0, 80),
        }
      }),
    )

    setIsThinking(true)
    setThinkingConvId(convId)

    try {
      const conv = conversations.find((c) => c.id === convId)
      const messages = [...(conv?.messages || []), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          model: selectedModel,
          conversationId: convId,
          userId,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const assistantMsgId = Math.random().toString(36).slice(2)
      let assistantContent = ""

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const asstMsg = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            createdAt: new Date().toISOString(),
          }
          const msgs = [...(c.messages || []), asstMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
          }
        }),
      )

      setIsThinking(false)
      setThinkingConvId(null)

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n").filter((line) => line.trim())

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") break

              try {
                const json = JSON.parse(data)
                if (json.message?.content) {
                  assistantContent += json.message.content

                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== convId) return c
                      const msgs = (c.messages || []).map((m) =>
                        m.id === assistantMsgId ? { ...m, content: assistantContent } : m,
                      )
                      return {
                        ...c,
                        messages: msgs,
                        preview: assistantContent.slice(0, 80),
                      }
                    }),
                  )
                }
              } catch (e) {
                console.error("[v0] Error parsing stream:", e)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setIsThinking(false)
      setThinkingConvId(null)

      const errorMsg = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please make sure the OLLAMA_API_KEY environment variable is set correctly.",
        createdAt: new Date().toISOString(),
      }

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const msgs = [...(c.messages || []), errorMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: errorMsg.content.slice(0, 80),
          }
        }),
      )
    }
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
      }),
    )
  }

  function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  function pauseThinking() {
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function handleUseTemplate(template) {
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content)
    }
  }

  const composerRef = useRef(null)

  const selected = conversations.find((c) => c.id === selectedId) || null

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="md:hidden sticky top-0 z-40 flex items-center gap-2 border-b border-zinc-200/60 bg-white/80 px-3 py-2 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="ml-1 flex items-center gap-2 text-sm font-semibold tracking-tight">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
            E
          </span>{" "}
          Eburon AI
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="Apps">
            <LayoutGrid className="h-4 w-4" />
          </GhostIconButton>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
          <ThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </div>

      <div className="mx-auto flex h-[calc(100vh-0px)] max-w-[1400px]">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          theme={theme}
          setTheme={setTheme}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id)}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
        />

        <main className="relative flex min-w-0 flex-1 flex-col">
          <Header
            createNewChat={createNewChat}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarOpen={setSidebarOpen}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <ChatPane
            ref={composerRef}
            conversation={selected}
            onSend={(content) => selected && sendMessage(selected.id, content)}
            onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
            selectedModel={selectedModel}
          />
        </main>
      </div>
    </div>
  )
}
