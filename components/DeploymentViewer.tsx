"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeBlock } from "@/components/CodeBlock"
import { Eye, Calendar, Code2, Play, Share2, Copy, Check } from "lucide-react"

interface Deployment {
  id: string
  slug: string
  name: string
  code: string
  language: string
  public: boolean
  views: number
  created_at: string
  updated_at: string
}

interface DeploymentViewerProps {
  deployment: Deployment
  isPrivate: boolean
}

export function DeploymentViewer({ deployment, isPrivate }: DeploymentViewerProps) {
  const [output, setOutput] = useState<string>("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const executeCode = async () => {
    setIsExecuting(true)
    setError(null)
    setOutput("")

    try {
      const response = await fetch("/api/execute-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: deployment.language,
          code: deployment.code,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setOutput(result.output || result.result || "Execution completed successfully")
      } else {
        setError(result.error || "Execution failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute code")
    } finally {
      setIsExecuting(false)
    }
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: deployment.name,
          text: `Check out this ${deployment.language} deployment on Eburon`,
          url: window.location.href,
        })
      } catch (err) {
        // User cancelled share
      }
    } else {
      copyUrl()
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{deployment.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{deployment.views} views</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(deployment.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Code2 className="w-4 h-4" />
                  <span>{deployment.language}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
              <Button variant="outline" size="sm" onClick={shareUrl}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge variant={deployment.public ? "default" : "secondary"}>
              {deployment.public ? "Public" : "Private"}
            </Badge>
            <Badge variant="outline">{deployment.language}</Badge>
          </div>
        </div>

        {/* Content */}
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>

          <TabsContent value="code" className="mt-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Source Code</h2>
                <Button onClick={executeCode} disabled={isExecuting}>
                  <Play className="w-4 h-4 mr-2" />
                  {isExecuting ? "Executing..." : "Run Code"}
                </Button>
              </div>
              <CodeBlock code={deployment.code} language={deployment.language} />
            </Card>
          </TabsContent>

          <TabsContent value="output" className="mt-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Execution Output</h2>
                {!output && !error && (
                  <Button onClick={executeCode} disabled={isExecuting}>
                    <Play className="w-4 h-4 mr-2" />
                    {isExecuting ? "Executing..." : "Run Code"}
                  </Button>
                )}
              </div>

              {isExecuting && (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}

              {error && (
                <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                  <p className="text-destructive font-mono text-sm">{error}</p>
                </div>
              )}

              {output && !error && (
                <div className="bg-muted rounded-lg p-4">
                  <pre className="font-mono text-sm whitespace-pre-wrap">{output}</pre>
                </div>
              )}

              {!output && !error && !isExecuting && (
                <div className="text-center py-12 text-muted-foreground">
                  <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Run Code" to execute and see the output</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>

        {/* Metadata */}
        <Card className="mt-6 p-4">
          <h3 className="font-semibold mb-2">Deployment Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Slug:</span>
              <span className="ml-2 font-mono">{deployment.slug}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Language:</span>
              <span className="ml-2">{deployment.language}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Created:</span>
              <span className="ml-2">{new Date(deployment.created_at).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Updated:</span>
              <span className="ml-2">{new Date(deployment.updated_at).toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
