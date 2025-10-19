"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Deployment {
  id: string
  slug: string
  name: string
}

interface DeleteDeploymentDialogProps {
  deployment: Deployment
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DeleteDeploymentDialog({ deployment, open, onOpenChange, onSuccess }: DeleteDeploymentDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/deploy?slug=${deployment.slug}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        onSuccess()
      }
    } catch (error) {
      console.error("Failed to delete deployment:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Deployment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{deployment.name}"? This action cannot be undone and the deployment will no
            longer be accessible at /slug/{deployment.slug}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90"
          >
            {loading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
