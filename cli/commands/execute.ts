import fs from "fs/promises"
import path from "path"
import chalk from "chalk"
import ora from "ora"
import chokidar from "chokidar"

interface ExecuteOptions {
  language?: string
  test?: boolean
  watch?: boolean
  server: string
}

export async function executeCode(filePath: string, options: ExecuteOptions) {
  const spinner = ora("Reading file...").start()

  try {
    // Read the file
    const code = await fs.readFile(filePath, "utf-8")
    spinner.succeed("File read successfully")

    // Detect language if not specified
    const language = options.language || detectLanguage(filePath)
    console.log(chalk.blue(`Language: ${language}`))

    // Execute the code
    await runCode(code, language, options)

    // Watch mode
    if (options.watch) {
      console.log(chalk.yellow("\nWatching for changes... (Press Ctrl+C to stop)"))
      const watcher = chokidar.watch(filePath)
      watcher.on("change", async () => {
        console.log(chalk.cyan("\n--- File changed, re-executing ---\n"))
        const newCode = await fs.readFile(filePath, "utf-8")
        await runCode(newCode, language, options)
      })
    }
  } catch (error) {
    spinner.fail("Execution failed")
    console.error(chalk.red(error instanceof Error ? error.message : "Unknown error"))
    process.exit(1)
  }
}

async function runCode(code: string, language: string, options: ExecuteOptions) {
  const spinner = ora("Executing code...").start()

  try {
    const response = await fetch(`${options.server}/api/execute-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Execution failed")
    }

    const result = await response.json()
    spinner.succeed("Execution completed")

    // Display results
    console.log(chalk.green("\n=== Output ==="))
    console.log(result.output || result.result)

    if (result.execution_time) {
      console.log(chalk.gray(`\nExecution time: ${result.execution_time}ms`))
    }

    if (result.test_results) {
      console.log(chalk.blue("\n=== Test Results ==="))
      result.test_results.forEach((test: any, index: number) => {
        if (test.passed) {
          console.log(chalk.green(`✓ Test ${index + 1}: PASSED`))
        } else {
          console.log(chalk.red(`✗ Test ${index + 1}: FAILED`))
          if (test.error) {
            console.log(chalk.red(`  Error: ${test.error}`))
          }
        }
      })
    }

    if (!result.success) {
      console.log(chalk.red("\n=== Error ==="))
      console.log(chalk.red(result.error))
    }
  } catch (error) {
    spinner.fail("Execution failed")
    throw error
  }
}

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const languageMap: Record<string, string> = {
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".py": "python",
    ".sql": "sql",
  }
  return languageMap[ext] || "javascript"
}
