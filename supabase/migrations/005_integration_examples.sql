-- Migration: Add integration code examples support
-- Issue: #37 - 工具集成代码示例库

-- Add integration_minutes column
ALTER TABLE tools ADD COLUMN IF NOT EXISTS integration_minutes INTEGER;

-- Add code_examples column (JSONB for flexibility)
ALTER TABLE tools ADD COLUMN IF NOT EXISTS code_examples JSONB DEFAULT '{}';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tools_integration_minutes ON tools(integration_minutes);

-- Comment on columns
COMMENT ON COLUMN tools.integration_minutes IS 'Estimated integration time in minutes';
COMMENT ON COLUMN tools.code_examples IS 'Multi-language code examples: {python: {install, init, basic, error_handling, env_vars}, typescript: {...}, ...}';

-- Update some tools with integration data

-- Mem0 (Memory)
UPDATE tools SET 
  integration_minutes = 5,
  code_examples = '{
    "python": {
      "install": "pip install mem0ai",
      "init": "from mem0 import Memory\nm = Memory()",
      "basic": "# Add memory\nm.add(\"User prefers dark mode\", user_id=\"user_123\")\n\n# Search memory\nresult = m.search(\"preferences\", user_id=\"user_123\")\nprint(result)",
      "error_handling": "from mem0.exceptions import Mem0Error\n\ntry:\n    m.add(data)\nexcept Mem0Error as e:\n    print(f\"Error: {e}\")\n    # Retry or fallback logic",
      "env_vars": ["MEM0_API_KEY"]
    },
    "typescript": {
      "install": "npm install mem0ai",
      "init": "import { Memory } from ''mem0ai'';\nconst m = new Memory();",
      "basic": "// Add memory\nawait m.add(''User prefers dark mode'', { userId: ''user_123'' });\n\n// Search memory\nconst result = await m.search(''preferences'', { userId: ''user_123'' });\nconsole.log(result);",
      "error_handling": "try {\n  await m.add(data);\n} catch (error) {\n  console.error(''Error:'', error.message);\n}",
      "env_vars": ["MEM0_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'mem0';

-- Browserbase (Web Automation)
UPDATE tools SET 
  integration_minutes = 10,
  code_examples = '{
    "python": {
      "install": "pip install browserbase",
      "init": "from browserbase import Browserbase\n\nbb = Browserbase(api_key=\"your_api_key\")",
      "basic": "# Create a browser session\nsession = bb.sessions.create()\n\n# Navigate to a page\npage = session.page(\"https://example.com\")\nprint(page.content())\n\n# Close session\nsession.close()",
      "error_handling": "from browserbase.exceptions import BrowserbaseError\n\ntry:\n    session = bb.sessions.create()\nexcept BrowserbaseError as e:\n    print(f\"Session failed: {e}\")\n    # Retry with different settings",
      "env_vars": ["BROWSERBASE_API_KEY"]
    },
    "typescript": {
      "install": "npm install @browserbase/sdk",
      "init": "import { Browserbase } from ''@browserbase/sdk'';\n\nconst bb = new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });",
      "basic": "// Create a browser session\nconst session = await bb.sessions.create();\n\n// Navigate and get content\nconst page = await session.page(''https://example.com'');\nconsole.log(await page.content());\n\n// Close session\nawait session.close();",
      "error_handling": "try {\n  const session = await bb.sessions.create();\n} catch (error) {\n  console.error(''Session failed:'', error.message);\n}",
      "env_vars": ["BROWSERBASE_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'browserbase';

-- E2B (Code Execution)
UPDATE tools SET 
  integration_minutes = 5,
  code_examples = '{
    "python": {
      "install": "pip install e2b_code_interpreter",
      "init": "from e2b_code_interpreter import Sandbox",
      "basic": "with Sandbox() as sandbox:\n    # Execute Python code\n    execution = sandbox.run_code(\"print(''Hello from E2B!'')\")\n    print(execution.stdout)\n    \n    # Execute with charts\n    execution = sandbox.run_code(\"import matplotlib.pyplot as plt\\nplt.plot([1,2,3])\")\n    execution.show()",
      "error_handling": "from e2b_code_interpreter.exceptions import SandboxError\n\ntry:\n    with Sandbox() as sandbox:\n        execution = sandbox.run_code(code)\nexcept SandboxError as e:\n    print(f\"Sandbox error: {e}\")",
      "env_vars": ["E2B_API_KEY"]
    },
    "typescript": {
      "install": "npm install @e2b/code-interpreter",
      "init": "import { Sandbox } from ''@e2b/code-interpreter''",
      "basic": "const sandbox = await Sandbox.create();\n\n// Execute code\nconst execution = await sandbox.runCode(\"print(''Hello!'')\");\nconsole.log(execution.stdout);\n\n// Cleanup\nawait sandbox.close();",
      "error_handling": "try {\n  const sandbox = await Sandbox.create();\n} catch (error) {\n  console.error(''Sandbox error:'', error.message);\n}",
      "env_vars": ["E2B_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'e2b';

-- Firecrawl (Web Scraping)
UPDATE tools SET 
  integration_minutes = 5,
  code_examples = '{
    "python": {
      "install": "pip install firecrawl-py",
      "init": "from firecrawl import FirecrawlApp\n\napp = FirecrawlApp(api_key=\"your_api_key\")",
      "basic": "# Scrape a single page\nresult = app.scrape_url(\"https://example.com\")\nprint(result[\"markdown\"])\n\n# Crawl an entire site\ncrawl_result = app.crawl_url(\"https://example.com\")",
      "error_handling": "from firecrawl.exceptions import FirecrawlError\n\ntry:\n    result = app.scrape_url(url)\nexcept FirecrawlError as e:\n    print(f\"Scraping failed: {e}\")",
      "env_vars": ["FIRECRAWL_API_KEY"]
    },
    "typescript": {
      "install": "npm install @mendable/firecrawl-js",
      "init": "import FirecrawlApp from ''@mendable/firecrawl-js'';\n\nconst app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });",
      "basic": "// Scrape a single page\nconst result = await app.scrapeUrl(''https://example.com'');\nconsole.log(result.markdown);\n\n// Crawl an entire site\nconst crawlResult = await app.crawlUrl(''https://example.com'');",
      "error_handling": "try {\n  const result = await app.scrapeUrl(url);\n} catch (error) {\n  console.error(''Scraping failed:'', error.message);\n}",
      "env_vars": ["FIRECRAWL_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'firecrawl';

-- Jina Reader (Simple URL to Markdown)
UPDATE tools SET 
  integration_minutes = 2,
  code_examples = '{
    "python": {
      "install": "# No installation needed - just use requests",
      "init": "import requests",
      "basic": "# Convert any URL to markdown\nurl = \"https://example.com\"\nresponse = requests.get(f\"https://r.jina.ai/{url}\")\nprint(response.text)",
      "error_handling": "try:\n    response = requests.get(f\"https://r.jina.ai/{url}\")\n    response.raise_for_status()\nexcept requests.RequestException as e:\n    print(f\"Request failed: {e}\")"
    },
    "typescript": {
      "install": "# No installation needed - just use fetch",
      "init": "// No init needed",
      "basic": "// Convert any URL to markdown\nconst url = ''https://example.com'';\nconst response = await fetch(`https://r.jina.ai/${url}`);\nconst markdown = await response.text();\nconsole.log(markdown);",
      "error_handling": "try {\n  const response = await fetch(`https://r.jina.ai/${url}`);\n  if (!response.ok) throw new Error(''Request failed'');\n} catch (error) {\n  console.error(''Error:'', error.message);\n}"
    }
  }'::jsonb
WHERE slug = 'jina-reader';

-- LangChain (Framework)
UPDATE tools SET 
  integration_minutes = 15,
  code_examples = '{
    "python": {
      "install": "pip install langchain langchain-openai",
      "init": "from langchain_openai import ChatOpenAI\nfrom langchain.agents import initialize_agent, Tool\n\nllm = ChatOpenAI(model=\"gpt-4\")",
      "basic": "# Define tools\ntools = [\n    Tool(\n        name=\"Calculator\",\n        func=lambda x: eval(x),\n        description=\"Useful for math\"\n    )\n]\n\n# Create agent\nagent = initialize_agent(tools, llm, agent=\"zero-shot-react-description\")\nresult = agent.run(\"What is 2 + 2?\")\nprint(result)",
      "error_handling": "from langchain.schema import OutputParserException\n\ntry:\n    result = agent.run(query)\nexcept OutputParserException as e:\n    print(f\"Agent failed to parse: {e}\")",
      "env_vars": ["OPENAI_API_KEY"]
    },
    "typescript": {
      "install": "npm install langchain @langchain/openai",
      "init": "import { ChatOpenAI } from ''@langchain/openai'';\nimport { initializeAgentExecutorWithOptions } from ''langchain/agents'';\n\nconst llm = new ChatOpenAI({ modelName: ''gpt-4'' });",
      "basic": "// Define tools and create agent\nconst tools = [/* your tools */];\nconst executor = await initializeAgentExecutorWithOptions({\n  agentType: ''zero-shot-react-description'',\n  tools,\n  llm,\n});\n\nconst result = await executor.call({ input: ''What is 2 + 2?'' });\nconsole.log(result.output);",
      "error_handling": "try {\n  const result = await executor.call({ input });\n} catch (error) {\n  console.error(''Agent error:'', error.message);\n}",
      "env_vars": ["OPENAI_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'langchain';

-- Composio (Integration Platform)
UPDATE tools SET 
  integration_minutes = 10,
  code_examples = '{
    "python": {
      "install": "pip install composio-langchain",
      "init": "from composio_langchain import ComposioToolSet, App\n\ntoolset = ComposioToolSet()",
      "basic": "# Get GitHub tools\ntools = toolset.get_tools(apps=[App.GITHUB])\n\n# Use with LangChain agent\nfrom langchain.agents import initialize_agent\nagent = initialize_agent(tools, llm)\nresult = agent.run(\"Star the repo owner/repo\")",
      "error_handling": "from composio.exceptions import ComposioError\n\ntry:\n    tools = toolset.get_tools(apps=[App.GITHUB])\nexcept ComposioError as e:\n    print(f\"Failed to get tools: {e}\")",
      "env_vars": ["COMPOSIO_API_KEY"]
    },
    "typescript": {
      "install": "npm install composio-langchain",
      "init": "import { ComposioToolSet, App } from ''composio-langchain'';\n\nconst toolset = new ComposioToolSet();",
      "basic": "// Get GitHub tools\nconst tools = await toolset.getTools({ apps: [App.GITHUB] });\n\n// Use with LangChain agent\nconst executor = await initializeAgentExecutorWithOptions({\n  agentType: ''zero-shot-react-description'',\n  tools,\n  llm,\n});",
      "error_handling": "try {\n  const tools = await toolset.getTools({ apps: [App.GITHUB] });\n} catch (error) {\n  console.error(''Failed to get tools:'', error.message);\n}",
      "env_vars": ["COMPOSIO_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'composio';

-- Apify (Web Scraping)
UPDATE tools SET 
  integration_minutes = 10,
  code_examples = '{
    "python": {
      "install": "pip install apify-client",
      "init": "from apify_client import ApifyClient\n\nclient = ApifyClient(\"your_api_token\")",
      "basic": "# Run an actor (web scraper)\nrun = client.actor(\"apify/web-scraper\").call(\n    run_input={\n        \"startUrls\": [{\"url\": \"https://example.com\"}],\n        \"pageFunction\": \"async function pageFunction(context) {...}\"\n    }\n)\n\n# Get results\nfor item in client.dataset(run[\"defaultDatasetId\"]).iterate_items():\n    print(item)",
      "error_handling": "from apify_client.errors import ApifyApiError\n\ntry:\n    run = client.actor(actor_id).call(run_input)\nexcept ApifyApiError as e:\n    print(f\"Actor run failed: {e}\")",
      "env_vars": ["APIFY_API_TOKEN"]
    },
    "typescript": {
      "install": "npm install apify-client",
      "init": "import { ApifyClient } from ''apify-client'';\n\nconst client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });",
      "basic": "// Run an actor\nconst run = await client.actor(''apify/web-scraper'').call({\n  startUrls: [{ url: ''https://example.com'' }],\n});\n\n// Get results\nconst { items } = await client.dataset(run.defaultDatasetId).list();\nconsole.log(items);",
      "error_handling": "try {\n  const run = await client.actor(actorId).call(input);\n} catch (error) {\n  console.error(''Actor run failed:'', error.message);\n}",
      "env_vars": ["APIFY_API_TOKEN"]
    }
  }'::jsonb
WHERE slug = 'apify';

-- AgentMail (Email)
UPDATE tools SET 
  integration_minutes = 5,
  code_examples = '{
    "python": {
      "install": "pip install agentmail",
      "init": "from agentmail import AgentMail\n\nclient = AgentMail(api_key=\"your_api_key\")",
      "basic": "# Create an inbox\ninbox = client.inboxes.create()\n\n# Send an email\nclient.emails.send(\n    from_inbox_id=inbox.id,\n    to=\"recipient@example.com\",\n    subject=\"Hello from Agent\",\n    body=\"This is an automated email.\"\n)",
      "error_handling": "from agentmail.exceptions import AgentMailError\n\ntry:\n    client.emails.send(...)\nexcept AgentMailError as e:\n    print(f\"Email failed: {e}\")",
      "env_vars": ["AGENTMAIL_API_KEY"]
    },
    "typescript": {
      "install": "npm install agentmail",
      "init": "import { AgentMail } from ''agentmail'';\n\nconst client = new AgentMail({ apiKey: process.env.AGENTMAIL_API_KEY });",
      "basic": "// Create an inbox\nconst inbox = await client.inboxes.create();\n\n// Send an email\nawait client.emails.send({\n  fromInboxId: inbox.id,\n  to: ''recipient@example.com'',\n  subject: ''Hello from Agent'',\n  body: ''This is an automated email.''\n});",
      "error_handling": "try {\n  await client.emails.send(...);\n} catch (error) {\n  console.error(''Email failed:'', error.message);\n}",
      "env_vars": ["AGENTMAIL_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'agentmail';

-- Langfuse (Observability)
UPDATE tools SET 
  integration_minutes = 5,
  code_examples = '{
    "python": {
      "install": "pip install langfuse",
      "init": "from langfuse import Langfuse\n\nlangfuse = Langfuse(\n    public_key=\"pk-xxx\",\n    secret_key=\"sk-xxx\"\n)",
      "basic": "# Create a trace\ntrace = langfuse.trace(\n    name=\"agent-run\",\n    metadata={\"user_id\": \"user_123\"}\n)\n\n# Log a span\nspan = trace.span(name=\"llm-call\")\nspan.end()\n\n# Flush to send data\nlangfuse.flush()",
      "error_handling": "from langfuse.exceptions import LangfuseError\n\ntry:\n    langfuse.flush()\nexcept LangfuseError as e:\n    print(f\"Langfuse error: {e}\")",
      "env_vars": ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"]
    },
    "typescript": {
      "install": "npm install langfuse",
      "init": "import { Langfuse } from ''langfuse'';\n\nconst langfuse = new Langfuse({\n  publicKey: process.env.LANGFUSE_PUBLIC_KEY,\n  secretKey: process.env.LANGFUSE_SECRET_KEY,\n});",
      "basic": "// Create a trace\nconst trace = langfuse.trace({\n  name: ''agent-run'',\n  metadata: { userId: ''user_123'' }\n});\n\n// Log a span\nconst span = trace.span({ name: ''llm-call'' });\nspan.end();\n\n// Flush to send data\nawait langfuse.flushAsync();",
      "error_handling": "try {\n  await langfuse.flushAsync();\n} catch (error) {\n  console.error(''Langfuse error:'', error.message);\n}",
      "env_vars": ["LANGFUSE_PUBLIC_KEY", "LANGFUSE_SECRET_KEY"]
    }
  }'::jsonb
WHERE slug = 'langfuse';

-- Zep (Memory)
UPDATE tools SET 
  integration_minutes = 5,
  code_examples = '{
    "python": {
      "install": "pip install zep-python",
      "init": "from zep_cloud.client import Zep\n\nzep = Zep(api_key=\"your_api_key\")",
      "basic": "# Add memory\nzep.memory.add(\n    session_id=\"session_123\",\n    messages=[{\"role\": \"user\", \"content\": \"I prefer dark mode\"}]\n)\n\n# Search memory\nresults = zep.memory.search(\n    session_id=\"session_123\",\n    text=\"preferences\"\n)",
      "error_handling": "from zep_cloud.exceptions import ZepError\n\ntry:\n    zep.memory.add(...)\nexcept ZepError as e:\n    print(f\"Zep error: {e}\")",
      "env_vars": ["ZEP_API_KEY"]
    },
    "typescript": {
      "install": "npm install @getzep/zep-js",
      "init": "import { ZepClient } from ''@getzep/zep-js'';\n\nconst zep = new ZepClient({ apiKey: process.env.ZEP_API_KEY });",
      "basic": "// Add memory\nawait zep.memory.add(''session_123'', [\n  { role: ''user'', content: ''I prefer dark mode'' }\n]);\n\n// Search memory\nconst results = await zep.memory.search(''session_123'', ''preferences'');",
      "error_handling": "try {\n  await zep.memory.add(...);\n} catch (error) {\n  console.error(''Zep error:'', error.message);\n}",
      "env_vars": ["ZEP_API_KEY"]
    }
  }'::jsonb
WHERE slug = 'zep';