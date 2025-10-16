# Ollama Cloud Setup for Eburon AI

## Quick Setup

Run the automated setup script:

\`\`\`bash
chmod +x scripts/setup-ollama.sh
./scripts/setup-ollama.sh
\`\`\`

## Manual Setup

If you prefer to run commands manually:

### 1. Sign in to Ollama Cloud
\`\`\`bash
ollama signin
\`\`\`

### 2. Pull Required Models
\`\`\`bash
# DeepSeek V3.1 (671B parameters)
ollama pull deepseek-v3.1:671b-cloud

# GPT-OSS 20B
ollama pull gpt-oss:20b-cloud

# GPT-OSS 120B (Emilio)
ollama pull gpt-oss:120b-cloud

# Kimi K2 (1T parameters)
ollama pull kimi-k2:1t-cloud

# Qwen3-Coder 480B (Alex-Coder)
ollama pull qwen3-coder:480b-cloud
\`\`\`

## Verify Installation

Check that all models are installed:

\`\`\`bash
ollama list
\`\`\`

You should see all five models listed.

## Troubleshooting

- **Authentication fails**: Make sure you have an Ollama Cloud account at https://ollama.com
- **Model pull fails**: Check your internet connection and try again
- **Slow downloads**: These are large models (20B-1T parameters), downloads may take time

## Next Steps

Once setup is complete, start the Eburon AI application:

\`\`\`bash
npm run dev
\`\`\`

The models will be available in the model dropdown in the UI.
