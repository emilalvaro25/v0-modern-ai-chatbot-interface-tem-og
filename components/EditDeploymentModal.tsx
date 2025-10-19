"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface Deployment {
  id: string
  slug: string
  name: string
  language: string
  public: boolean
}

interface EditDeploymentModalProps {
  deployment: Deployment & { code?: string }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditDeploymentModal({ deployment, open, onOpenChange, onSuccess }: EditDeploymentModalProps) {
  const [name, setName] = useState(deployment.name)
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState(deployment.language)
  const [isPublic, setIsPublic] = useState(deployment.public)
  const [loading, setLoading] = useState(false)
  const [fetchingCode, setFetchingCode] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch full deployment details including code
    const fetchDeployment = async () => {
      try {
        const response = await fetch(`/api/deploy/${deployment.slug}`)
        const data = await response.json()
        if (data.success) {
          setCode(data.deployment.code)
        }
      } catch (err) {
        setError("Failed to load deployment code")
      } finally {
        setFetchingCode(false)
      }
    }

    fetchDeployment()
  }, [deployment.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/deploy/${deployment.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          language,
          public: isPublic,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || "Failed to update deployment")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update deployment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Deployment</DialogTitle>
          <DialogDescription>Update your deployment settings and code</DialogDescription>
        </DialogHeader>

        {fetchingCode ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div>
              <Label>Slug</Label>
              <Input value={deployment.slug} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Slug cannot be changed</p>
            </div>

            <div>
              <Label htmlFor="edit-language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-code">Code</Label>
              <Textarea
                id="edit-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono min-h-[200px]"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="edit-public">Make this deployment public</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
