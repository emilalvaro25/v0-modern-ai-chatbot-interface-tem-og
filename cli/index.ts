#!/usr/bin/env node

import { Command } from "commander"
import { executeCode } from "./commands/execute"
import { testConnection } from "./commands/test"
import { deploy } from "./commands/deploy"
import { listDeployments } from "./commands/list"

const program = new Command()

program
  .name("eburon")
  .description("Eburon AI CLI - Execute code, test connections, and deploy to unique endpoints")
  .version("1.0.0")

// Execute code command
program
  .command("exec <file>")
  .description("Execute a code file in the Eburon sandbox")
  .option("-l, --language <lang>", "Programming language (auto-detected if not specified)")
  .option("-t, --test", "Run with test cases")
  .option("-w, --watch", "Watch file for changes and re-execute")
  .option("-s, --server <url>", "Eburon server URL", "http://localhost:3000")
  .action(async (file, options) => {
    await executeCode(file, options)
  })

// Test connection command
program
  .command("test")
  .description("Test connection to Eburon server")
  .option("-s, --server <url>", "Eburon server URL", "http://localhost:3000")
  .action(async (options) => {
    await testConnection(options)
  })

// Deploy command
program
  .command("deploy <file>")
  .description("Deploy code to a unique slug endpoint")
  .option("-n, --name <name>", "Deployment name")
  .option("-s, --slug <slug>", "Custom slug (auto-generated if not specified)")
  .option("--public", "Make deployment publicly accessible", false)
  .option("-s, --server <url>", "Eburon server URL", "http://localhost:3000")
  .action(async (file, options) => {
    await deploy(file, options)
  })

// List deployments command
program
  .command("list")
  .description("List all deployments")
  .option("-s, --server <url>", "Eburon server URL", "http://localhost:3000")
  .action(async (options) => {
    await listDeployments(options)
  })

// Run command (alias for exec)
program
  .command("run <file>")
  .description("Run a code file (alias for exec)")
  .option("-l, --language <lang>", "Programming language")
  .option("-s, --server <url>", "Eburon server URL", "http://localhost:3000")
  .action(async (file, options) => {
    await executeCode(file, options)
  })

program.parse()
