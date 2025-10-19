import { DeploymentDashboard } from "@/components/DeploymentDashboard"

export const metadata = {
  title: "Manage Deployments | Eburon",
  description: "Manage your code deployments",
}

export default function ManagePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <DeploymentDashboard />
    </div>
  )
}
