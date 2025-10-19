# Eburon CLI

Command-line interface for Eburon AI code execution and deployment.

## Installation

\`\`\`bash
npm install -g @eburon/cli
\`\`\`

## Usage

### Execute Code

\`\`\`bash
# Execute a file
eburon exec script.py

# Execute with language specified
eburon exec script.js --language javascript

# Watch mode (re-execute on file changes)
eburon exec script.py --watch

# Run with test cases
eburon exec script.py --test
\`\`\`

### Test Connection

\`\`\`bash
# Test connection to local server
eburon test

# Test connection to custom server
eburon test --server https://eburon.dev
\`\`\`

### Deploy Code

\`\`\`bash
# Deploy to unique slug
eburon deploy app.js

# Deploy with custom slug
eburon deploy app.js --slug my-app

# Deploy with name
eburon deploy app.js --name "My Application"

# Deploy as public
eburon deploy app.js --public
\`\`\`

### List Deployments

\`\`\`bash
# List all deployments
eburon list

# List from custom server
eburon list --server https://eburon.dev
\`\`\`

## Options

- `-s, --server <url>` - Eburon server URL (default: http://localhost:3000)
- `-l, --language <lang>` - Programming language (auto-detected from file extension)
- `-w, --watch` - Watch file for changes
- `-t, --test` - Run with test cases
- `--public` - Make deployment publicly accessible

## Supported Languages

- JavaScript (.js, .mjs, .cjs)
- TypeScript (.ts)
- Python (.py)
- SQL (.sql)

## Examples

\`\`\`bash
# Execute Python script
eburon exec data_analysis.py

# Deploy Next.js app
eburon deploy app.js --name "My Next.js App" --public

# Watch and re-execute on changes
eburon exec script.js --watch

# Test server connection
eburon test --server https://eburon.dev
