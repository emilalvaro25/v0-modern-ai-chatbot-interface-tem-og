import chalk from "chalk"
import ora from "ora"

interface TestOptions {
  server: string
}

export async function testConnection(options: TestOptions) {
  const spinner = ora("Testing connection to Eburon server...").start()

  try {
    const response = await fetch(`${options.server}/api/test-connection`, {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`)
    }

    const result = await response.json()
    spinner.succeed("Connection successful")

    console.log(chalk.green("\n=== Server Status ==="))
    console.log(chalk.blue(`Endpoint: ${result.endpoint || options.server}`))
    console.log(chalk.blue(`Status: ${result.success ? "Online" : "Offline"}`))

    if (result.error) {
      console.log(chalk.red(`Error: ${result.error}`))
    }
  } catch (error) {
    spinner.fail("Connection failed")
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"))
    process.exit(1)
  }
}
