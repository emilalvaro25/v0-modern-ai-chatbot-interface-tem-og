"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Sidebar from "./Sidebar"
import Header from "./Header"
import ChatPane from "./ChatPane"
import PlanApprovalModal from "./PlanApprovalModal"

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

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth >= 768 // md breakpoint
  })

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

  const [agentMode, setAgentMode] = useState(false)
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [pendingPrompt, setPendingPrompt] = useState(null)
  const [pendingConvId, setPendingConvId] = useState(null)
  const [planThinking, setPlanThinking] = useState(false)

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
        if (typeof window !== "undefined" && window.innerWidth < 768) {
          setSidebarOpen(false)
        }
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

  useEffect(() => {
    if (agentMode) {
      setSelectedModel("qwen3-coder:480b-cloud")
    }
  }, [agentMode])

  async function sendMessage(convId, content, isAgentMode = false) {
    if (!content.trim()) return

    if (isAgentMode) {
      setPendingPrompt(content)
      setPendingConvId(convId)
      setPlanThinking(true)
      setShowPlanModal(true)

      try {
        const response = await fetch("/api/agent/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: content,
            model: "gpt-oss:20b-cloud",
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate plan")
        }

        const data = await response.json()
        setCurrentPlan(data.plan)
        setPlanThinking(false)
      } catch (error) {
        console.error("[v0] Error generating plan:", error)
        setPlanThinking(false)
        setShowPlanModal(false)
        alert("Please check your EMILIOAI_API_KEY by notifying Master E to check the server")
      }
      return
    }

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

      const isCodingAgent =
        typeof selectedModel === "string"
          ? selectedModel === "qwen3-coder:480b-cloud"
          : selectedModel.model === "qwen3-coder:480b-cloud"

      const isThinkingMode = typeof selectedModel === "object" && selectedModel.thinking === true
      const actualModel = typeof selectedModel === "string" ? selectedModel : selectedModel.model

      console.log("[v0] Sending message to Emilio Server...")
      console.log("[v0] Model:", actualModel)
      console.log("[v0] Thinking mode:", isThinkingMode)
      console.log("[v0] Tools enabled:", isCodingAgent)

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          model: actualModel,
          conversationId: convId,
          userId,
          enableTools: isCodingAgent,
          enableThinking: isThinkingMode,
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] API error response:", errorText)
        throw new Error(`API error: ${response.statusText}`)
      }

      const assistantMsgId = Math.random().toString(36).slice(2)
      let assistantContent = ""
      let assistantThinking = ""
      let toolExecutions = []

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const asstMsg = {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            thinking: "",
            createdAt: new Date().toISOString(),
            toolExecutions: [],
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

                if (json.message?.thinking) {
                  assistantThinking += json.message.thinking

                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== convId) return c
                      const msgs = (c.messages || []).map((m) =>
                        m.id === assistantMsgId ? { ...m, thinking: assistantThinking } : m,
                      )
                      return { ...c, messages: msgs }
                    }),
                  )
                }

                if (json.type === "tool_call") {
                  console.log("[v0] Tool call:", json.tool)
                  toolExecutions.push({
                    name: json.tool,
                    status: "executing",
                    args: json.args,
                  })

                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== convId) return c
                      const msgs = (c.messages || []).map((m) =>
                        m.id === assistantMsgId ? { ...m, toolExecutions: [...toolExecutions] } : m,
                      )
                      return { ...c, messages: msgs }
                    }),
                  )
                }

                if (json.type === "tool_result") {
                  console.log("[v0] Tool result:", json.tool, json.result)
                  toolExecutions = toolExecutions.map((t) =>
                    t.name === json.tool ? { ...t, status: "completed", result: json.result } : t,
                  )

                  setConversations((prev) =>
                    prev.map((c) => {
                      if (c.id !== convId) return c
                      const msgs = (c.messages || []).map((m) =>
                        m.id === assistantMsgId ? { ...m, toolExecutions: [...toolExecutions] } : m,
                      )
                      return { ...c, messages: msgs }
                    }),
                  )
                }

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

      const currentConv = conversations.find((c) => c.id === convId)
      if (currentConv && currentConv.title === "New Chat" && assistantContent) {
        generateAndUpdateTitle(convId, [
          { role: "user", content },
          { role: "assistant", content: assistantContent },
        ])
      }
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setIsThinking(false)
      setThinkingConvId(null)

      const errorMsg = {
        id: Math.random().toString(36).slice(2),
        role: "assistant",
        content: "Please check your EMILIOAI_API_KEY by notifying Master E to check the server",
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

  async function generateAndUpdateTitle(convId, messages) {
    try {
      const response = await fetch("/api/conversations/generate-title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          model: "gpt-oss:20b-cloud", // Use fast model for title generation
        }),
      })

      if (!response.ok) {
        console.error("[v0] Failed to generate title")
        return
      }

      const data = await response.json()
      const newTitle = data.title

      const updateResponse = await fetch("/api/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          title: newTitle,
        }),
      })

      if (updateResponse.ok) {
        setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, title: newTitle } : c)))
      }
    } catch (error) {
      console.error("[v0] Error generating/updating title:", error)
    }
  }

  function handlePlanApprove() {
    setShowPlanModal(false)
    if (pendingPrompt && pendingConvId) {
      // Execute with the plan context
      const enhancedPrompt = `${pendingPrompt}\n\n[Agent Plan]\n${JSON.stringify(currentPlan, null, 2)}`
      sendMessage(pendingConvId, enhancedPrompt, false)
    }
    resetPlanState()
  }

  function handlePlanReject() {
    setShowPlanModal(false)
    resetPlanState()
  }

  function handlePlanEdit() {
    setShowPlanModal(false)
    if (composerRef.current && currentPlan) {
      const planText = `Original Request: ${pendingPrompt}\n\nProposed Plan:\n${currentPlan.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nThinking: ${currentPlan.thinking}\n\nPlease modify the plan as needed:`
      composerRef.current.insertTemplate(planText)
    }
    resetPlanState()
  }

  function resetPlanState() {
    setCurrentPlan(null)
    setPendingPrompt(null)
    setPendingConvId(null)
    setPlanThinking(false)
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

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div className="h-screen w-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex h-full w-full">
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
          onSelect={(id) => {
            setSelectedId(id)
            if (typeof window !== "undefined" && window.innerWidth < 768) {
              setSidebarOpen(false)
            }
          }}
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
            sidebarOpen={sidebarOpen}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
          <ChatPane
            ref={composerRef}
            conversation={selected}
            onSend={(content) => {
              if (!selected) {
                createNewChat().then(() => {
                  setTimeout(() => {
                    const newConv = conversations[0]
                    if (newConv) {
                      sendMessage(newConv.id, content, agentMode)
                    }
                  }, 100)
                })
              } else {
                sendMessage(selected.id, content, agentMode)
              }
            }}
            onEditMessage={(messageId, newContent) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
            selectedModel={selectedModel}
            agentMode={agentMode}
            onAgentModeChange={setAgentMode}
          />
        </main>
      </div>

      <PlanApprovalModal
        isOpen={showPlanModal}
        plan={currentPlan}
        thinking={planThinking}
        onApprove={handlePlanApprove}
        onReject={handlePlanReject}
        onEdit={handlePlanEdit}
      />
    </div>
  )
}
