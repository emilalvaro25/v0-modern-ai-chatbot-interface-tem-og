# Eburon AI Chatbot - Setup Instructions

## Current Status

✅ **Completed:**
- Environment files configured (.env and .env.local)
- Prisma schema set up
- Prisma client generated
- Docker and Docker Compose configured
- All frontend components working (Chat, Copy to Clipboard, etc.)
- Swagger API documentation ready
- Development server running on port 3005

✅ **Database:**
- Migrated from Supabase to Neon PostgreSQL
- Connection strings updated with pooled and direct URLs

## How to Verify the Database Connection

### Option 1: Check Neon Project Status

1. Go to your Neon dashboard: https://console.neon.tech/
2. Verify your project is **ACTIVE**
3. Check the connection details match your environment variables

### Option 2: Test Database Connection

Test the connection using Prisma:

```bash
npx prisma db push
```

If successful, you should see tables created in your Neon database.

### Option 3: Check Database Tables

1. Check if the tables exist in your Neon database
2. Go to Neon Console → SQL Editor
3. Run this query to check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

4. If tables exist, the app should work once the connection is restored
5. If tables don't exist, run the SQL scripts in the `scripts/` folder

## Testing the Application

Once the database connection is fixed:

1. **Access the app:** http://localhost:3005
2. **Test chat functionality:**
   - Type a message in the composer
   - Press Enter to send
   - Watch for the AI response streaming in

3. **Test copy to clipboard:**
   - Look for code blocks in AI responses
   - Click the "Copy" button on any code block
   - Verify clipboard functionality

4. **Test voice input:**
   - Click the microphone icon
   - Allow microphone permissions
   - Speak your message
   - Click again to stop and transcribe

## Swagger API Documentation

Once the database is working, access Swagger at:
- **Swagger UI:** http://localhost:3005/api/docs
- **Swagger JSON:** http://localhost:3005/api/swagger

## Docker Setup

To run with Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

Services included:
- **app:** Next.js application (port 3000)
- **postgres:** PostgreSQL database (port 5432)
- **redis:** Redis cache (port 6379)
- **swagger-ui:** API documentation (port 8080)
- **prisma-studio:** Database GUI (port 5555) - dev only

## Environment Variables

Required variables in `.env.local`:

```env
# Database - Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxxxx-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:PASSWORD@ep-xxxxx.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Neon Auth (optional)
NEXT_PUBLIC_STACK_PROJECT_ID=xxxxx
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=xxxxx
STACK_SECRET_SERVER_KEY=xxxxx

# Vercel Blob Storage (optional)
BLOB_READ_WRITE_TOKEN=xxxxx

# AI API Keys
EBURON_API_KEY=xxxxx
EMILIOAI_API_KEY=xxxxx
OLLAMA_API_KEY=xxxxx

# Auth
NEXTAUTH_SECRET=xxxxx
NEXTAUTH_URL=http://localhost:3000
```

## Troubleshooting

### Database Connection Issues

1. **Check Neon project status** - Ensure it's active at https://console.neon.tech/
2. **Verify credentials** - Password must be included in connection string with sslmode=require
3. **Check network** - Ensure firewall allows outbound connections
4. **Test direct connection:**
   ```bash
   npx prisma db push
   ```

### Chat Not Sending Messages

1. **Check browser console** - Look for JavaScript errors
2. **Verify AI API key** - Ensure EMILIOAI_API_KEY is valid
3. **Check network tab** - Verify POST requests to /api/chat
4. **Test API directly:**
   ```bash
   curl -X POST http://localhost:3005/api/chat \
     -H "Content-Type: application/json" \
     -d '{"messages":[{"role":"user","content":"Hello"}],"model":"gpt-oss:120b-cloud"}'
   ```

### Copy to Clipboard Not Working

1. **Ensure HTTPS or localhost** - Clipboard API requires secure context
2. **Check browser permissions** - Allow clipboard access
3. **Verify CodeBlock component** - Should show "Copy" button

## Features Summary

✅ **Working Features:**
- Chat interface with streaming responses
- Code block rendering with syntax highlighting
- Copy to clipboard functionality for code blocks
- Voice input with transcription (Deepgram)
- Multiple AI models (GPT-OSS, Qwen Coder, DeepSeek)
- Thinking mode for reasoning
- Agent mode for task planning
- Conversation management
- Message editing and resending
- Dark/Light theme toggle
- Responsive design (mobile & desktop)

🔧 **Needs Database Connection:**
- Conversation persistence
- Message history
- User authentication
- Session management

## Next Steps

1. **Fix database connection** (see Option 1, 2, or 3 above)
2. **Test the chat interface**
3. **Verify all features are working**
4. **Run `npm run build` to test production build**
5. **Deploy to production** (Vercel, Docker, etc.)

## Support

If you continue to have issues:
1. Check the terminal for detailed error messages
2. Verify all environment variables are set correctly
3. Ensure your Neon project is active and accessible
4. Contact Master E if API keys need to be refreshed

---

**Current Server:** http://localhost:3005
**Development Mode:** Active
**Status:** Database migrated to Neon PostgreSQL - ready for testing
