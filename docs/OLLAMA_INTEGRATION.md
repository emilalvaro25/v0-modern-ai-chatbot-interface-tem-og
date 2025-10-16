# Ollama Cloud Integration Guide

## Overview

Eburon AI is powered by Ollama Cloud, providing access to state-of-the-art language models with advanced capabilities including tool calling, web search, and thinking modes.

## Available Models

### Emilio-120b (gpt-oss:120b-cloud)
- **Use Case**: General conversation, complex reasoning, detailed responses
- **Parameters**: 120 billion
- **Best For**: In-depth analysis, creative writing, comprehensive explanations
- **Default Model**: Yes

### Emilio-120b-Thinking (gpt-oss:120b-cloud with thinking enabled)
- **Use Case**: Transparent reasoning, step-by-step problem solving
- **Parameters**: 120 billion
- **Best For**: Educational content, debugging logic, showing work
- **Special Feature**: Displays internal reasoning process before final answer

### Emilio-flash-20b (gpt-oss:20b-cloud)
- **Use Case**: Fast responses, quick tasks, planning
- **Parameters**: 20 billion
- **Best For**: Title generation, quick answers, agent planning
- **Speed**: Fastest model

### Aquilles-V3.1 (deepseek-v3.1:671b-cloud)
- **Use Case**: Advanced reasoning, complex problem solving
- **Parameters**: 671 billion
- **Best For**: Research, deep analysis, technical discussions

### Alex-Coder (qwen3-coder:480b-cloud)
- **Use Case**: Code generation, debugging, software development
- **Parameters**: 480 billion
- **Best For**: Writing code, code reviews, technical implementation
- **Special Feature**: Coding agent with tool calling capabilities

## Tool Calling

### Overview

Ollama Cloud supports function calling, allowing models to use external tools to enhance their capabilities. Eburon AI implements 8 specialized tools:

### Available Tools

1. **web_search**
   - Search the web for current information
   - Parameters: `query` (string)
   - Use: Finding documentation, current events, solutions

2. **analyze_error**
   - Analyze error messages and stack traces
   - Parameters: `error` (string), `context` (string)
   - Use: Debugging, error resolution

3. **execute_code**
   - Execute code snippets safely
   - Parameters: `code` (string), `language` (string)
   - Use: Testing code, validating solutions

4. **read_documentation**
   - Fetch and read documentation
   - Parameters: `url` (string), `topic` (string)
   - Use: Learning APIs, understanding libraries

5. **validate_code**
   - Validate code syntax and best practices
   - Parameters: `code` (string), `language` (string)
   - Use: Code review, quality assurance

6. **query_database**
   - Query the Neon database
   - Parameters: `query` (string)
   - Use: Data retrieval, analytics

7. **analyze_conversation**
   - Analyze conversation patterns and context
   - Parameters: `conversationId` (string)
   - Use: Understanding context, personalization

8. **compare_approaches**
   - Compare different solution approaches
   - Parameters: `approaches` (array), `criteria` (string)
   - Use: Decision making, optimization

### Tool Calling API Format

\`\`\`typescript
// Request with tools
{
  "model": "qwen3-coder:480b-cloud",
  "messages": [...],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "web_search",
        "description": "Search the web for information",
        "parameters": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "The search query"
            }
          },
          "required": ["query"]
        }
      }
    }
  ]
}

// Response with tool call
{
  "message": {
    "role": "assistant",
    "content": null,
    "tool_calls": [
      {
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "web_search",
          "arguments": "{\"query\":\"Next.js 15 features\"}"
        }
      }
    ]
  }
}
\`\`\`

## Web Search Integration

### Overview

All Ollama Cloud models have access to web search capabilities, enabling them to find current information and reduce hallucinations.

### Configuration

Web search is enabled by default for all models. The system automatically:
- Detects when web search would be helpful
- Executes searches in the background
- Integrates results into responses
- Cites sources when available

### Usage in System Prompts

\`\`\`typescript
const systemPrompt = `
You have access to web search. Use it when:
- User asks about current events or recent information
- You need to verify facts or find documentation
- The question requires up-to-date data
- You're unsure about specific technical details

Always cite sources when using web search results.
`
\`\`\`

## Thinking Mode

### Overview

Thinking mode (available in Emilio-120b-Thinking) separates the model's reasoning process from its final answer, providing transparency into how conclusions are reached.

### API Usage

\`\`\`typescript
// Enable thinking mode
{
  "model": "gpt-oss:120b-cloud",
  "messages": [...],
  "think": true  // Enable thinking mode
}

// Response with thinking
{
  "message": {
    "role": "assistant",
    "thinking": "Let me break this down step by step...",
    "content": "Based on my analysis, the answer is..."
  }
}
\`\`\`

### UI Display

Thinking content is displayed in a collapsible section with:
- Emerald gradient background
- Brain icon indicator
- Expandable/collapsible interface
- Separate from final answer

## Agent Mode

### Overview

Agent Mode uses Alex-Coder (qwen3-coder:480b-cloud) with full tool calling capabilities to execute complex coding tasks iteratively.

### Workflow

1. **Planning Phase**: Uses gpt-oss:20b-cloud to generate execution plan
2. **Approval**: User approves, rejects, or modifies plan
3. **Execution**: Alex-Coder executes plan with tool calling
4. **Iteration**: Continues until task completion

### Tool Usage in Agent Mode

Agent mode automatically:
- Searches web for documentation
- Executes code to test solutions
- Validates code quality
- Analyzes errors and fixes them
- Queries database when needed

## Memory System

### Short-term Memory

- Conversation history (last 10 messages)
- Current session context
- Active tool executions

### Long-term Memory

- Stored in Neon database
- User preferences and patterns
- Conversation summaries
- Historical context

### Redis Caching

- Recent messages cached for 1 hour
- Conversation context cached for 30 minutes
- Reduces database queries
- Improves response time

## Best Practices

### Model Selection

- **Quick tasks**: Use Emilio-flash-20b
- **General chat**: Use Emilio-120b (default)
- **Coding**: Use Alex-Coder
- **Deep reasoning**: Use Aquilles-V3.1
- **Learning**: Use Emilio-120b-Thinking

### Tool Calling

- Be specific in tool descriptions
- Validate tool results before using
- Handle tool errors gracefully
- Log tool executions for debugging

### Web Search

- Use for current information only
- Cite sources in responses
- Verify search results
- Combine with existing knowledge

### Performance

- Cache frequently accessed data
- Use streaming for long responses
- Batch tool calls when possible
- Monitor API usage and costs

## Environment Variables

\`\`\`bash
# Required
OLLAMA_API_KEY=your_api_key_here

# Database
DATABASE_URL=your_neon_database_url

# Redis
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_redis_token

# Search
UPSTASH_SEARCH_REST_URL=your_upstash_search_url
UPSTASH_SEARCH_REST_TOKEN=your_upstash_search_token

# Blob Storage
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
\`\`\`

## API Endpoints

### Chat
- `POST /api/chat` - Send messages, stream responses
- Supports: tool calling, thinking mode, streaming

### Agent
- `POST /api/agent/plan` - Generate execution plan
- Uses: gpt-oss:20b-cloud for fast planning

### Tools
- `POST /api/tools` - Execute tool calls
- Handles: all 8 tool types

### Memory
- `GET /api/memory` - Retrieve conversation memory
- `POST /api/memory` - Store memory context

### Search
- `POST /api/search` - Search conversations
- Uses: Upstash Search for semantic search

## Troubleshooting

### Common Issues

1. **Tool calls not working**
   - Verify OLLAMA_API_KEY is set
   - Check tool definitions match API format
   - Ensure model supports tool calling

2. **Thinking mode not displaying**
   - Confirm `think: true` in API request
   - Check model is gpt-oss:120b-cloud
   - Verify UI component is rendering thinking

3. **Web search failing**
   - Check API key permissions
   - Verify network connectivity
   - Review search query format

4. **Memory not persisting**
   - Confirm DATABASE_URL is correct
   - Check Redis connection
   - Verify user ID is being set

## Future Integrations

Planned integrations for Eburon AI:

- **VSCode Extension**: Direct IDE integration
- **Codex**: Enhanced code completion
- **Cline**: Terminal integration
- **Droid**: Mobile app support
- **Goose**: Automated workflows
- **Zed**: Real-time collaboration
- **Roo Code**: Advanced code analysis

## Resources

- [Ollama Cloud Documentation](https://docs.ollama.com/cloud)
- [API Reference](https://docs.ollama.com/api)
- [Tool Calling Guide](https://docs.ollama.com/api#chat-request-with-tools)
- [Web Search Documentation](https://docs.ollama.com/web-search)
- [Thinking Mode Blog](https://ollama.com/blog/thinking)
