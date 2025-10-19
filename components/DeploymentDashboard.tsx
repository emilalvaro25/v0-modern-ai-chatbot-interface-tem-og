"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Eye, Calendar, Code2, ExternalLink, Trash2, Edit, Globe, Lock } from "lucide-react"
import { CreateDeploymentModal } from "@/components/CreateDeploymentModal"
import { EditDeploymentModal } from "@/components/EditDeploymentModal"
import { DeleteDeploymentDialog } from "@/components/DeleteDeploymentDialog"
import Link from "next/link"

interface Deployment {
  id: string
  slug: string
  name: string
  language: string
  public: boolean
  views: number
  created_at: string
  updated_at: string
}

export function DeploymentDashboard() {
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingDeployment, setEditingDeployment] = useState<Deployment | null>(null)
  const [deletingDeployment, setDeletingDeployment] = useState<Deployment | null>(null)

  useEffect(() => {
    fetchDeployments()
  }, [])

  const fetchDeployments = async () => {
    try {
      const response = await fetch("/api/deploy")
      const data = await response.json()
      if (data.success) {
        setDeployments(data.deployments)
      }
    } catch (error) {
      console.error("Failed to fetch deployments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeploymentCreated = () => {
    setCreateModalOpen(false)
    fetchDeployments()
  }

  const handleDeploymentUpdated = () => {
    setEditingDeployment(null)
    fetchDeployments()
  }

  const handleDeploymentDeleted = () => {
    setDeletingDeployment(null)
    fetchDeployments()
  }

  const filteredDeployments = deployments.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.language.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Deployments</h1>
            <p className="text-muted-foreground">Create, edit, and manage your code deployments</p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Deployment
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deployments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Deployments</p>
              <p className="text-2xl font-bold">{deployments.length}</p>
            </div>
            <Code2 className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Public</p>
              <p className="text-2xl font-bold">{deployments.filter((d) => d.public).length}</p>
            </div>
            <Globe className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Views</p>
              <p className="text-2xl font-bold">{deployments.reduce((sum, d) => sum + d.views, 0)}</p>
            </div>
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Deployments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredDeployments.length === 0 ? (
        <Card className="p-12 text-center">
          <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">{searchQuery ? "No deployments found" : "No deployments yet"}</h2>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Try a different search term" : "Create your first deployment to get started"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Deployment
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDeployments.map((deployment) => (
            <Card key={deployment.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{deployment.name}</h3>
                    <Badge variant="outline">{deployment.language}</Badge>
                    {deployment.public ? (
                      <Badge variant="default" className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Code2 className="w-4 h-4" />
                      <span className="font-mono">{deployment.slug}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{deployment.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(deployment.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/slug/${deployment.slug}`} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setEditingDeployment(deployment)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingDeployment(deployment)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateDeploymentModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={handleDeploymentCreated}
      />

      {editingDeployment && (
        <EditDeploymentModal
          deployment={editingDeployment}
          open={!!editingDeployment}
          onOpenChange={(open) => !open && setEditingDeployment(null)}
          onSuccess={handleDeploymentUpdated}
        />
      )}

      {deletingDeployment && (
        <DeleteDeploymentDialog
          deployment={deletingDeployment}
          open={!!deletingDeployment}
          onOpenChange={(open) => !open && setDeletingDeployment(null)}
          onSuccess={handleDeploymentDeleted}
        />
      )}
    </div>
  )
}
