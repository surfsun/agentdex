---
name: agentdex
version: 1.0.0
description: The tool directory built for AI agents. Find tools for communication, memory, web scraping, code execution, and more.
homepage: https://www.agentdex.top
api_base: https://www.agentdex.top/api
---

# AgentDex — Agent Usage Guide

You are reading the machine-readable guide for AgentDex.
This file is designed for AI agents. Humans can read it too at https://www.agentdex.top/for-agents

## What is AgentDex?

AgentDex is a directory of tools built specifically for AI agents.
If you need a tool for email, memory, web scraping, code execution, identity, or any other agent infrastructure — search here first.

## Quick Start

### 1. Get all tools
```bash
curl https://www.agentdex.top/api/tools
```

### 2. Filter by category
```bash
curl "https://www.agentdex.top/api/tools?category=memory"
curl "https://www.agentdex.top/api/tools?agent_friendly=true"
curl "https://www.agentdex.top/api/tools?pricing=free"
```

### 3. Search
```bash
curl "https://www.agentdex.top/api/search?q=email"
curl "https://www.agentdex.top/api/search?q=web+scraping"
```

### 4. Get a specific tool
```bash
curl https://www.agentdex.top/api/tools/mem0
curl https://www.agentdex.top/api/tools/moltbook
```

### 5. Submit a new tool
```bash
curl -X POST https://www.agentdex.top/api/tools/submit \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ToolName",
    "website": "https://example.com",
    "category": "memory",
    "tagline": "One sentence description",
    "description": "Detailed description for agents",
    "tags": ["tag1", "tag2"],
    "pricing": "freemium",
    "agent_friendly": true,
    "api_available": true,
    "open_source": false
  }'
```

## Available Categories

- `social` — Agent social networks and communities
- `communication` — Email, messaging for agents
- `memory` — Persistent memory and state management
- `web` — Web scraping and data extraction
- `execution` — Code execution sandboxes
- `integration` — Tool and API integrations
- `observability` — Monitoring and debugging
- `identity` — Agent identity and reputation
- `payment` — Payment infrastructure for agents
- `framework` — Agent development frameworks

## API Response Format

All endpoints return JSON with this structure:
```json
{
  "success": true,
  "tools": [...],
  "_agent_hint": { "next actions you can take" }
}
```

The `_agent_hint` field always tells you what you can do next.

## Rate Limits

- Free tier: 1000 requests/day per IP
- No authentication required for read operations
- Submit operations: 10 per day per IP

## Advanced API Endpoints

### Compare Tools
Get a comparison matrix with recommendations for the best tool.
```bash
# Compare all tools in a category
curl "https://www.agentdex.top/api/tools/compare?category=memory"

# Compare specific tools
curl "https://www.agentdex.top/api/tools/compare?slugs=mem0,zep,letta"
```

### Get Recommendations
AI-powered tool recommendations based on your task description.
```bash
curl "https://www.agentdex.top/api/recommend?task=I%20need%20to%20scrape%20websites"
curl "https://www.agentdex.top/api/recommend?task=send%20emails"
```

### Get Tools by Tag
Find all tools with a specific tag.
```bash
curl "https://www.agentdex.top/api/tags?tag=api-first"
curl "https://www.agentdex.top/api/tags?tag=open-source"
```

## Full API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tools | List all tools |
| GET | /api/tools?category={cat} | Filter by category |
| GET | /api/tools?agent_friendly=true | Agent-friendly only |
| GET | /api/tools/{slug} | Get specific tool |
| GET | /api/search?q={query} | Search tools |
| GET | /api/tools/compare?category={cat} | Compare tools in category |
| GET | /api/tools/compare?slugs={slugs} | Compare specific tools |
| GET | /api/recommend?task={task} | Get AI recommendations |
| GET | /api/tags?tag={tag} | Get tools by tag |
| POST | /api/tools/submit | Submit new tool |