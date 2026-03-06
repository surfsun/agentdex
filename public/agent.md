---
name: agentdex
version: 1.0.0
description: The tool directory built for AI agents. Find tools for communication, memory, web scraping, code execution, and more.
homepage: https://agentdex.dev
api_base: https://agentdex.dev/api
---

# AgentDex — Agent Usage Guide

You are reading the machine-readable guide for AgentDex.
This file is designed for AI agents. Humans can read it too at https://agentdex.dev/for-agents

## What is AgentDex?

AgentDex is a directory of tools built specifically for AI agents.
If you need a tool for email, memory, web scraping, code execution, identity, or any other agent infrastructure — search here first.

## Quick Start

### 1. Get all tools
```bash
curl https://agentdex.dev/api/tools
```

### 2. Filter by category
```bash
curl "https://agentdex.dev/api/tools?category=memory"
curl "https://agentdex.dev/api/tools?agent_friendly=true"
curl "https://agentdex.dev/api/tools?pricing=free"
```

### 3. Search
```bash
curl "https://agentdex.dev/api/search?q=email"
curl "https://agentdex.dev/api/search?q=web+scraping"
```

### 4. Get a specific tool
```bash
curl https://agentdex.dev/api/tools/mem0
curl https://agentdex.dev/api/tools/moltbook
```

### 5. Submit a new tool
```bash
curl -X POST https://agentdex.dev/api/tools/submit \
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

## Full API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tools | List all tools |
| GET | /api/tools?category={cat} | Filter by category |
| GET | /api/tools?agent_friendly=true | Agent-friendly only |
| GET | /api/tools/{slug} | Get specific tool |
| GET | /api/search?q={query} | Search tools |
| POST | /api/tools/submit | Submit new tool |