````md
# Eburon AI - Advanced AI Chatbot with Coding Agent

*Powered by Emilio AI*

[![Powered by Emilio AI](https://img.shields.io/badge/Powered%20by-Emilio%20AI-blueviolet?style=for-the-badge&logo=starship)](#)
[![Hosted by Emilio AI Infra](https://img.shields.io/badge/Hosted%20by-Emilio%20AI%20Infra-darkgreen?style=for-the-badge&logo=cloudflare)](https://portfolio.ai-emilio.site)

## Overview

Eburon AI is an advanced chatbot interface powered solely by Emilio AI, featuring a specialized coding agent that operates in continuous execution loops. Built with Next.js 15, React 19, and integrated with Neon PostgreSQL for conversation persistence.

## Features

### 🤖 AI Models
- **Emilio-120b** – Large general-purpose model  
- **Emilio-flash-20b** – Fast lightweight model  
- **Emilio-Coder** – Specialized coding agent  

### 🛠️ Eburon Coding Agent (Emilio-Coder)
The Emilio-Coder model features a specialized agentic system:

**Continuous Execution Loop:**
- Iterative problem-solving until completion  
- Real-time tool execution with visual feedback  
- Automatic error detection and debugging  
- Progress tracking and status indicators  

**Available Tools:**
1. **Web Search** – Real-time web search  
2. **Error Analysis** – Intelligent error diagnosis and fixes  
3. **Code Execution** – Sandboxed code testing  
4. **Documentation Reader** – Fetch and parse docs  
5. **Code Validator** – Syntax and best practice checks  

**Capabilities:**
- Full-stack web development (React, Next.js, TypeScript, Python)  
- Database design and optimization  
- API development and integration  
- Modern UI/UX implementation  
- Real-time debugging and testing  
- DevOps and deployment automation  

### 💾 Database Integration
- **Neon PostgreSQL** for conversation and message persistence  
- Automatic conversation history loading  
- Real-time message synchronization  
- User session management  

### 🎨 Modern UI/UX
- Dark/Light theme support  
- Responsive design for all devices  
- Real-time streaming responses  
- Tool execution indicators  
- Conversation management (pin, search, organize)  
- Template system for quick prompts  

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript  
- **Styling**: Tailwind CSS, shadcn/ui  
- **Database**: Neon PostgreSQL  
- **AI Models**: Emilio AI  
- **Deployment**: Emilio AI Infra  

## Environment Variables

Required environment variables (set in Emilio Infra or `.env.local`):

```bash
# Emilio AI
EMILIO_API_KEY=your_emilio_api_key

# Neon Database
DATABASE_URL=your_neon_database_url
POSTGRES_URL=your_postgres_url
````

## Getting Started

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`
4. Run the development server:

   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Database Setup

Run the SQL migration scripts in order:

```bash
# Create tables
psql $DATABASE_URL -f scripts/001_create_conversations_and_messages.sql

# Fix user_id type (if needed)
psql $DATABASE_URL -f scripts/002_fix_user_id_type.sql
```

## Usage

### General Chat

1. Select any Emilio model (Emilio-120b, Emilio-flash-20b)
2. Start a new conversation
3. Chat naturally with the AI

### Coding Agent (Emilio-Coder)

1. Select "Emilio-Coder"
2. Ask for coding tasks, debugging, or development help
3. Watch as the agent:

   * Searches docs
   * Analyzes errors
   * Executes code
   * Iterates until the task is complete

**Example Prompts:**

* "Build a REST API with authentication using Next.js"
* "Debug this TypeScript error: [paste error]"
* "Create a responsive dashboard with charts"
* "Optimize this SQL query for better performance"

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/          # Main chat API with streaming
│   │   ├── conversations/ # Conversation CRUD
│   │   ├── messages/      # Message retrieval
│   │   └── tools/         # Tool execution endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AIAssistantUI.jsx  # Main UI component
│   ├── ChatPane.jsx       # Chat interface
│   ├── Composer.jsx       # Message input
│   ├── Header.jsx         # Top navigation
│   ├── Sidebar.jsx        # Conversation sidebar
│   └── ...
├── lib/
│   ├── system-prompt.ts         # General AI prompt
│   ├── coding-agent-prompt.ts   # Coding agent prompt
│   └── tools.ts                 # Tool definitions and handlers
└── scripts/
    └── *.sql              # Database migrations
```

## Deployment

Your project is live at:

**[https://portfolio.ai-emilio.site](https://portfolio.ai-emilio.site)**

## How It Works

1. User sends a message through the Composer
2. Message is saved to Neon database
3. Request is sent to Emilio AI API with appropriate model
4. For Emilio-Coder: Tools are enabled and executed
5. Response streams back in real-time
6. Assistant message is saved to database
7. UI updates with streaming content and tool execution status

## License

MIT

---

**Built with ❤️ by Aquilles Team**
