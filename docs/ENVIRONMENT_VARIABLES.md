# Environment Variables - Eburon AI Platform

This document outlines all required and optional environment variables for the Eburon AI HyperFocus platform.

## Required Variables

### 1. Database Configuration

```bash
# Neon PostgreSQL Connection
DATABASE_URL=postgresql://user:password@host/database
POSTGRES_URL=postgresql://user:password@host/database
```

### 2. Emilio AI Core API

```bash
# Primary API Key (use any of these aliases)
EBURON_API_KEY=your_api_key_here
# OR
EMILIOAI_API_KEY=your_api_key_here
# OR  
OLLAMA_API_KEY=your_api_key_here

# API Endpoint (optional, defaults to https://ollama.com)
OLLAMA_CLOUD_API=https://ollama.com
```

**Note:** The system accepts multiple environment variable names for backwards compatibility. Set at least one of the API keys above.

### 3. Authentication

```bash
# JWT Secret (must be a strong random string)
NEXTAUTH_SECRET=your_super_secret_jwt_token_minimum_32_characters
NEXTAUTH_URL=http://localhost:3000  # or your production URL
```

## Optional Variables

### 4. Eburon Voice Services

#### Speech-to-Text (STT)
```bash
# Eburon STT API Key
EBURON_STT_KEY=your_deepgram_api_key_here
# OR
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

**Note:** If not configured, the system will fall back to browser-based speech recognition.

#### Text-to-Speech (TTS)
```bash
# Eburon TTS API Key (for future Gemini integration)
EBURON_TTS_KEY=your_gemini_api_key_here
```

**Note:** Currently uses browser Speech Synthesis API. Gemini integration coming soon.

### 5. Caching & Search

```bash
# Upstash Redis (for session caching)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Upstash Vector (for conversation search)
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

# Upstash Search (custom search implementation)
UPSTASH_SEARCH_REST_URL=your_upstash_search_url
UPSTASH_SEARCH_REST_TOKEN=your_upstash_search_token
```

## Environment File Template

Create a `.env.local` file in your project root:

```bash
# ===== REQUIRED =====

# Database
DATABASE_URL=postgresql://user:password@host/database
POSTGRES_URL=postgresql://user:password@host/database

# Emilio AI API (choose one variable name)
EBURON_API_KEY=xxxxxxxx.xxxxxxxx
# EMILIOAI_API_KEY=xxxxxxxx.xxxxxxxx
# OLLAMA_API_KEY=xxxxxxxx.xxxxxxxx

# Authentication
NEXTAUTH_SECRET=generate_a_strong_random_string_here_minimum_32_chars
NEXTAUTH_URL=http://localhost:3000

# ===== OPTIONAL =====

# Voice Services
EBURON_STT_KEY=your_stt_api_key  # Speech-to-Text
EBURON_TTS_KEY=your_tts_api_key  # Text-to-Speech

# Caching & Search
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_VECTOR_REST_URL=
UPSTASH_VECTOR_REST_TOKEN=
UPSTASH_SEARCH_REST_URL=
UPSTASH_SEARCH_REST_TOKEN=

# API Endpoint Override (optional)
# OLLAMA_CLOUD_API=https://ollama.com
```

## Generating Secure Secrets

### NEXTAUTH_SECRET

Generate a cryptographically secure random string:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32

# Or visit: https://generate-secret.vercel.app/32
```

## Environment-Specific Configuration

### Development
```bash
NEXTAUTH_URL=http://localhost:3000
```

### Production (Vercel)
```bash
NEXTAUTH_URL=https://your-domain.vercel.app
```

Configure these in the Vercel dashboard under Settings > Environment Variables.

## API Key Formats

### EBURON_API_KEY (Emilio AI)
- Format: `xxxxxxxx.xxxxxxxx`
- Two parts separated by a dot
- Each part minimum 8 characters
- Example: `abcd1234.wxyz9876`

### EBURON_STT_KEY
- Standard API key format
- Obtained from Deepgram dashboard
- Example: `1234567890abcdef1234567890abcdef`

### EBURON_TTS_KEY
- Standard API key format  
- Obtained from Google AI Studio (Gemini)
- Example: `AIzaSyABC123...`

## Validation

The system automatically validates:
- API key format and structure
- URL formats for endpoints
- Required vs optional variables
- Connection to services on startup

## Troubleshooting

### "API key validation failed"
- Ensure your `EBURON_API_KEY` follows the format: `xxxxxxxx.xxxxxxxx`
- Check that both parts are at least 8 characters long
- Verify no extra spaces or characters

### "Eburon STT service not configured"
- Set `EBURON_STT_KEY` environment variable
- Or use browser-based fallback (no API key needed)

### "Authentication required"
- Verify `NEXTAUTH_SECRET` is set
- Ensure it's at least 32 characters
- Check `NEXTAUTH_URL` matches your deployment URL

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - Add `.env.local` to `.gitignore`
   - Use `.env.example` as a template

2. **Rotate keys regularly**
   - Change `NEXTAUTH_SECRET` periodically
   - Update API keys when security incidents occur

3. **Use different keys per environment**
   - Separate keys for development, staging, production
   - Never use production keys in development

4. **Restrict key permissions**
   - Use read-only keys where possible
   - Implement rate limiting
   - Monitor usage patterns

## Support

For API key issues, contact:
- **Emilio AI API**: Master E
- **Voice Services**: System Administrator
- **Database**: Database Administrator

---

**Last Updated:** October 2025  
**Platform:** Eburon AI HyperFocus
