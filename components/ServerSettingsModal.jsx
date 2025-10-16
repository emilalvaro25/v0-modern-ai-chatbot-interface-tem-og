"use client"
import { useState, useEffect } from "react"
import { X, Lock, Settings, Wrench, Plug, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { INTEGRATIONS } from "@/lib/integrations"

export default function ServerSettingsModal({ isOpen, onClose }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("tools")
  const [integrations, setIntegrations] = useState(INTEGRATIONS)
  const [connectionStatus, setConnectionStatus] = useState({})

  const CORRECT_PIN = "120221"

  useEffect(() => {
    if (isOpen) {
      const savedIntegrations = localStorage.getItem("eburon_integrations")
      if (savedIntegrations) {
        setIntegrations(JSON.parse(savedIntegrations))
      }
      checkConnectionStatus()
    }
  }, [isOpen])

  const checkConnectionStatus = async () => {
    const status = {}
    for (const integration of integrations) {
      if (integration.supportsOAuth) {
        try {
          const response = await fetch(`/api/integrations/status?provider=${integration.id}`)
          const data = await response.json()
          status[integration.id] = data.connected
        } catch (error) {
          console.error(`[Eburon] Failed to check status for ${integration.id}:`, error)
          status[integration.id] = false
        }
      }
    }
    setConnectionStatus(status)
  }

  const handlePinSubmit = (e) => {
    e.preventDefault()
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true)
      setError("")
    } else {
      setError("Invalid PIN code")
      setPin("")
    }
  }

  const handleToggleIntegration = (id) => {
    const updated = integrations.map((int) => (int.id === id ? { ...int, enabled: !int.enabled } : int))
    setIntegrations(updated)
    localStorage.setItem("eburon_integrations", JSON.stringify(updated))
  }

  const handleFieldChange = (integrationId, fieldKey, value) => {
    const updated = integrations.map((int) => {
      if (int.id === integrationId) {
        return {
          ...int,
          fields: int.fields.map((field) => (field.key === fieldKey ? { ...field, value } : field)),
        }
      }
      return int
    })
    setIntegrations(updated)
    localStorage.setItem("eburon_integrations", JSON.stringify(updated))
  }

  const handleConnect = async (integration) => {
    const clientId = integration.fields.find((f) => f.key === "clientId")?.value
    const redirectUrl = integration.fields.find((f) => f.key === "redirectUrl")?.value

    if (!clientId || !redirectUrl) {
      alert("Please fill in Client ID and Redirect URL first")
      return
    }

    document.cookie = `${integration.id}_integration=${JSON.stringify({
      clientId,
      clientSecret: integration.fields.find((f) => f.key === "clientSecret")?.value,
      redirectUrl,
    })}; path=/; max-age=600`

    const oauthUrl = `/api/oauth/${integration.id}?clientId=${encodeURIComponent(
      clientId,
    )}&redirectUrl=${encodeURIComponent(redirectUrl)}`
    window.location.href = oauthUrl
  }

  const handleDisconnect = async (integrationId) => {
    try {
      await fetch("/api/integrations/status", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: integrationId }),
      })
      setConnectionStatus({ ...connectionStatus, [integrationId]: false })
    } catch (error) {
      console.error(`[Eburon] Failed to disconnect ${integrationId}:`, error)
    }
  }

  const handleClose = () => {
    setIsUnlocked(false)
    setPin("")
    setError("")
    onClose()
  }

  if (!isOpen) return null

  const categories = {
    productivity: integrations.filter((i) => i.category === "productivity"),
    communication: integrations.filter((i) => i.category === "communication"),
    media: integrations.filter((i) => i.category === "media"),
    storage: integrations.filter((i) => i.category === "storage"),
    design: integrations.filter((i) => i.category === "design"),
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        {!isUnlocked ? (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-6">
              <Lock className="h-12 w-12 text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground">Server Settings</h2>
            <p className="mb-8 text-sm text-muted-foreground">Enter PIN to access server configuration</p>
            <form onSubmit={handlePinSubmit} className="w-full max-w-xs">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                maxLength={6}
                placeholder="Enter 6-digit PIN"
                className="w-full rounded-lg border border-input bg-background px-4 py-3 text-center text-lg tracking-widest text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                autoFocus
              />
              {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 font-semibold text-white hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                Unlock
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-white" />
                <h2 className="text-xl font-bold text-white">Server Settings</h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("tools")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "tools"
                    ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Wrench className="h-4 w-4" />
                Tools Management
              </button>
              <button
                onClick={() => setActiveTab("integrations")}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
                  activeTab === "integrations"
                    ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plug className="h-4 w-4" />
                Integration Configuration
              </button>
            </div>

            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 180px)" }}>
              {activeTab === "tools" && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Enable or disable Eburon tools. Disabled tools will not be available in the frontend.
                  </p>
                  {Object.entries(categories).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        {category}
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {items.map((integration) => (
                          <div
                            key={integration.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{integration.icon}</span>
                              <div>
                                <p className="font-semibold text-card-foreground">{integration.name}</p>
                                <p className="text-xs text-muted-foreground">{integration.description}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleIntegration(integration.id)}
                              className={`relative h-6 w-11 rounded-full transition-colors ${
                                integration.enabled ? "bg-emerald-500" : "bg-muted"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                  integration.enabled ? "left-5" : "left-0.5"
                                }`}
                              />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "integrations" && (
                <div className="space-y-6">
                  <p className="text-sm text-muted-foreground">
                    Configure API keys and OAuth credentials for enabled integrations. Click "Connect" to authorize
                    access.
                  </p>
                  {integrations
                    .filter((int) => int.enabled)
                    .map((integration) => (
                      <div key={integration.id} className="rounded-lg border border-border bg-card p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{integration.icon}</span>
                            <div>
                              <h3 className="text-lg font-bold text-card-foreground">{integration.name}</h3>
                              <p className="text-sm text-muted-foreground">{integration.description}</p>
                            </div>
                          </div>
                          {integration.supportsOAuth && (
                            <div className="flex items-center gap-2">
                              {connectionStatus[integration.id] ? (
                                <>
                                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    Connected
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-5 w-5 text-muted-foreground" />
                                  <span className="text-sm font-medium text-muted-foreground">Not Connected</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          {integration.fields.map((field) => (
                            <div key={field.key}>
                              <label className="mb-1 block text-sm font-medium text-foreground">
                                {field.label}
                                {field.required && <span className="ml-1 text-destructive">*</span>}
                              </label>
                              <input
                                type={field.type}
                                value={field.value || ""}
                                onChange={(e) => handleFieldChange(integration.id, field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </div>
                          ))}
                          {integration.supportsOAuth && (
                            <div className="flex gap-3 pt-2">
                              {!connectionStatus[integration.id] ? (
                                <button
                                  onClick={() => handleConnect(integration)}
                                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Connect with {integration.name}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDisconnect(integration.id)}
                                  className="rounded-lg border border-destructive px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                                >
                                  Disconnect
                                </button>
                              )}
                            </div>
                          )}
                          {integration.availableFunctions && integration.availableFunctions.length > 0 && (
                            <div className="mt-4 rounded-lg bg-muted p-3">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Available Functions for AI Agents
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {integration.availableFunctions.map((func) => (
                                  <span
                                    key={func}
                                    className="rounded-md bg-background px-2 py-1 text-xs font-mono text-foreground"
                                  >
                                    {func}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  {integrations.filter((int) => int.enabled).length === 0 && (
                    <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        No integrations enabled. Enable tools in the Tools Management tab to configure them here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
