# Ollama Integration Guide

## Overview
Eburon AI supports both **Ollama Cloud** and **Local Ollama** instances for running AI models.

## Ollama Cloud Setup

### 1. Get Your API Key
1. Sign up or sign in at [ollama.com](https://ollama.com)
2. Get your API key from your account settings

### 2. Configure Environment Variables
Add these to your Vercel project or `.env.local`:

\`\`\`bash
# Ollama Cloud API Key (required for cloud models)
EMILIOAI_API_KEY=your_api_key_here

# Ollama Cloud Endpoint (optional, defaults to https://ollama.com)
OLLAMA_CLOUD_API=https://ollama.com
\`\`\`

### 3. Available Cloud Models
- `gpt-oss:120b-cloud` - GPT-OSS 120B (default)
- `gpt-oss:20b-cloud` - GPT-OSS 20B
- `deepseek-v3.1:671b-cloud` - DeepSeek V3.1
- `kimi-k2:1t-cloud` - Kimi K2 (Emilio-Coder)
- `qwen3-coder:480b-cloud` - Qwen3 Coder
- `qwen3-vl:235b-cloud` - Qwen3 Vision (Aquiles-Vision)
- `glm-4.6:cloud` - GLM 4.6 (Alex-128K)

## Local Ollama Setup

### 1. Install Ollama
\`\`\`bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
\`\`\`

### 2. Pull Models
\`\`\`bash
# Sign in to access cloud models
ollama signin

# Pull cloud models
ollama pull gpt-oss:120b-cloud
ollama pull deepseek-v3.1:671b-cloud
ollama pull kimi-k2:1t-cloud
\`\`\`

### 3. Run Ollama Server
\`\`\`bash
# Start Ollama server (runs on localhost:11434)
ollama serve
\`\`\`

### 4. Configure Fallback (Optional)
The system automatically falls back to local Ollama if cloud is unavailable.

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMILIOAI_API_KEY` | Yes (for cloud) | - | Your Ollama Cloud API key |
| `OLLAMA_API_KEY` | No | - | Alternative API key variable |
| `OLLAMA_CLOUD_API` | No | `https://ollama.com` | Ollama Cloud endpoint URL |

## Troubleshooting

### Chat Not Working
1. **Check API Key**: Ensure `EMILIOAI_API_KEY` is set correctly
2. **Check URL Format**: `OLLAMA_CLOUD_API` must start with `http://` or `https://`
3. **Check Console Logs**: Look for validation errors in the browser console
4. **Verify Endpoint**: The default is `https://ollama.com` (not `https://api.ollama.com`)

### Invalid URL Error
If you see "Invalid URL format" in the console:
1. Remove or fix the `OLLAMA_CLOUD_API` environment variable
2. The system will automatically use the correct default: `https://ollama.com`
3. Redeploy your application

### API Key Error
If you see "Please check your EMILIOAI_API_KEY":
1. Verify your API key is correct at [ollama.com](https://ollama.com)
2. Ensure the environment variable is set in Vercel
3. Contact Master E if the issue persists

## API Endpoint Format

### Correct Format
\`\`\`bash
curl https://ollama.com/api/chat \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-oss:120b-cloud",
    "messages": [{
      "role": "user",
      "content": "Hello!"
    }],
    "stream": true
  }'
\`\`\`

### Important Notes
- Endpoint: `https://ollama.com/api/chat` (NOT `https://api.ollama.com`)
- Authentication: `Authorization: Bearer <token>` header
- Models: Must include `-cloud` suffix for cloud models
- Streaming: Set `"stream": true` for real-time responses

## Support
For issues or questions, contact Master E or check the server status.
