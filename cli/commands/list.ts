import chalk from "chalk"
import ora from "ora"

interface ListOptions {
  server: string
}

export async function listDeployments(options: ListOptions) {
  const spinner = ora("Fetching deployments...").start()

  try {
    const response = await fetch(`${options.server}/api/deploy`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const result = await response.json()
    spinner.succeed("Deployments fetched")

    if (!result.deployments || result.deployments.length === 0) {
      console.log(chalk.yellow("\nNo deployments found"))
      return
    }

    console.log(chalk.green(`\n=== Deployments (${result.deployments.length}) ===\n`))

    result.deployments.forEach((deployment: any) => {
      console.log(chalk.blue(`${deployment.name}`))
      console.log(chalk.gray(`  Slug: ${deployment.slug}`))
      console.log(chalk.gray(`  URL: ${options.server}/slug/${deployment.slug}`))
      console.log(chalk.gray(`  Public: ${deployment.public ? "Yes" : "No"}`))
      console.log(chalk.gray(`  Created: ${new Date(deployment.created_at).toLocaleString()}`))
      console.log()
    })
  } catch (error) {
    spinner.fail("Failed to fetch deployments")
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"))
    process.exit(1)
  }
}
