import Link from "next/link"
import { getSql } from "@/lib/database"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Calendar, Code2, ExternalLink } from "lucide-react"

export const metadata = {
  title: "Public Deployments | Eburon",
  description: "Browse public code deployments on Eburon",
}

export default async function DeploymentsPage() {
  const sql = getSql()

  const deployments = await sql`
    SELECT id, slug, name, language, public, views, created_at
    FROM deployments
    WHERE public = true
    ORDER BY created_at DESC
    LIMIT 50
  `

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Public Deployments</h1>
          <p className="text-muted-foreground">Browse code deployments shared by the community</p>
        </div>

        {deployments.length === 0 ? (
          <Card className="p-12 text-center">
            <Code2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No deployments yet</h2>
            <p className="text-muted-foreground mb-4">Be the first to deploy something!</p>
            <Button asChild>
              <Link href="/">Get Started</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deployments.map((deployment) => (
              <Card key={deployment.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg line-clamp-1">{deployment.name}</h3>
                  <Badge variant="outline">{deployment.language}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{deployment.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(deployment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Button asChild className="w-full bg-transparent" variant="outline">
                  <Link href={`/slug/${deployment.slug}`}>
                    View Deployment
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
