import fs from "fs/promises"
import chalk from "chalk"
import ora from "ora"
import { nanoid } from "nanoid"

interface DeployOptions {
  name?: string
  slug?: string
  public: boolean
  server: string
}

export async function deploy(filePath: string, options: DeployOptions) {
  const spinner = ora("Reading file...").start()

  try {
    const code = await fs.readFile(filePath, "utf-8")
    spinner.text = "Deploying to Eburon server..."

    const slug = options.slug || nanoid(10)
    const name = options.name || filePath

    const response = await fetch(`${options.server}/api/deploy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        slug,
        name,
        public: options.public,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Deployment failed")
    }

    const result = await response.json()
    spinner.succeed("Deployment successful")

    console.log(chalk.green("\n=== Deployment Info ==="))
    console.log(chalk.blue(`Name: ${result.name}`))
    console.log(chalk.blue(`Slug: ${result.slug}`))
    console.log(chalk.blue(`URL: ${options.server}/slug/${result.slug}`))
    console.log(chalk.blue(`Public: ${result.public ? "Yes" : "No"}`))
    console.log(chalk.gray(`\nCreated: ${new Date(result.created_at).toLocaleString()}`))
  } catch (error) {
    spinner.fail("Deployment failed")
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"))
    process.exit(1)
  }
}
