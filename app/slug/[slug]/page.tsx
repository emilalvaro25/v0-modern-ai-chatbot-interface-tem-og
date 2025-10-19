import { notFound } from "next/navigation"
import { getSql } from "@/lib/database"
import { DeploymentViewer } from "@/components/DeploymentViewer"

export const dynamic = "force-dynamic"

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = params

  try {
    const sql = getSql()
    const [deployment] = await sql`
      SELECT name, language, created_at
      FROM deployments
      WHERE slug = ${slug}
    `

    if (!deployment) {
      return {
        title: "Deployment Not Found",
      }
    }

    return {
      title: `${deployment.name} | Eburon`,
      description: `${deployment.language} deployment hosted on Eburon`,
    }
  } catch (error) {
    return {
      title: "Deployment Error",
    }
  }
}

export default async function DeploymentPage({ params }: PageProps) {
  const { slug } = params

  try {
    const sql = getSql()

    // Increment view count and get deployment
    const [deployment] = await sql`
      UPDATE deployments
      SET views = views + 1
      WHERE slug = ${slug}
      RETURNING id, slug, name, code, language, public, views, created_at, updated_at, user_id
    `

    if (!deployment) {
      notFound()
    }

    // Check if deployment is public
    if (!deployment.public) {
      // In production, check if user owns this deployment
      // For now, show a warning but allow access
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-6 bg-card rounded-lg border">
            <h1 className="text-2xl font-bold mb-4">Private Deployment</h1>
            <p className="text-muted-foreground mb-4">
              This deployment is marked as private. Only the owner can access it.
            </p>
            <DeploymentViewer deployment={deployment} isPrivate={true} />
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <DeploymentViewer deployment={deployment} isPrivate={false} />
      </div>
    )
  } catch (error) {
    console.error("Error loading deployment:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6 bg-card rounded-lg border">
          <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Deployment</h1>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    )
  }
}
