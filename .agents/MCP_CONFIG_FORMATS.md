# Raw MCP Config Formats — Ready to Copy-Paste

## 1️⃣ VS Code / Claude For VS Code Format

```json
{
  "mcpServers": {
    "nre-coordinator": {
      "command": "python3",
      "args": ["/Users/macm4/Documents/Projek/NRE/.agents/mcp_server.py"],
      "env": {
        "PROJECT_ROOT": "/Users/macm4/Documents/Projek/NRE",
        "AGENTS_DIR": "/Users/macm4/Documents/Projek/NRE/.agents",
        "STATE_FILE": "/Users/macm4/Documents/Projek/NRE/.agents/MCP_STATE.md",
        "CONFIG_FILE": "/Users/macm4/Documents/Projek/NRE/.agents/mcp.config.json",
        "ALERTS_FILE": "/Users/macm4/Documents/Projek/NRE/.agents/ALERTS.log",
        "FLASK_ENV": "production"
      },
      "disabled": false
    }
  }
}
```

**Where to paste**: 
- VS Code: `File > Preferences > Settings > Extensions > Cline / Claude > MCP Servers`
- Or edit directly: `~/.vscode/settings.json` or `.vscode/settings.json`

---

## 2️⃣ Docker Compose Format (for production)

```yaml
services:
  mcp-server:
    image: python:3.11-slim
    container_name: nre-mcp-server
    working_dir: /app
    command: python3 /app/.agents/mcp_server.py
    environment:
      PROJECT_ROOT: /app
      AGENTS_DIR: /app/.agents
      STATE_FILE: /app/.agents/MCP_STATE.md
      CONFIG_FILE: /app/.agents/mcp.config.json
      ALERTS_FILE: /app/.agents/ALERTS.log
      FLASK_ENV: production
      FLASK_DEBUG: 0
    ports:
      - "8888:8888"
    volumes:
      - .:/app
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - nre-network
```

**Where to paste**:
- `docker-compose.yml` under `services:` section

---

## 3️⃣ Environment (.env) Format

```bash
# MCP Server Configuration
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8888
MCP_SERVER_DEBUG=false

PROJECT_ROOT=/Users/macm4/Documents/Projek/NRE
AGENTS_DIR=/Users/macm4/Documents/Projek/NRE/.agents
STATE_FILE=/Users/macm4/Documents/Projek/NRE/.agents/MCP_STATE.md
CONFIG_FILE=/Users/macm4/Documents/Projek/NRE/.agents/mcp.config.json
ALERTS_FILE=/Users/macm4/Documents/Projek/NRE/.agents/ALERTS.log

FLASK_ENV=production
FLASK_DEBUG=0
```

**Where to paste**:
- `.env` or `.env.mcp` at project root

---

## 4️⃣ Anthropic Claude Desktop (claude_desktop_config.json)

```json
{
  "version": "1",
  "mcpServers": {
    "nre-coordinator": {
      "command": "/usr/bin/python3",
      "args": ["/Users/macm4/Documents/Projek/NRE/.agents/mcp_server.py"],
      "timeout": 5000
    }
  }
}
```

**Where to paste**:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

---

## 5️⃣ Cline / VS Code Cline Extension Format

```json
{
  "mcpServers": [
    {
      "name": "nre-coordinator",
      "type": "command",
      "command": "python3",
      "args": ["/Users/macm4/Documents/Projek/NRE/.agents/mcp_server.py"],
      "env": {
        "PROJECT_ROOT": "/Users/macm4/Documents/Projek/NRE",
        "AGENTS_DIR": "/Users/macm4/Documents/Projek/NRE/.agents"
      },
      "disabled": false
    }
  ]
}
```

**Where to paste**:
- `.cline/config.json` or Cline settings panel

---

## 6️⃣ Systemd Service Format (Linux/Mac)

```ini
[Unit]
Description=NRE MCP Coordinator Server
After=network.target

[Service]
Type=simple
User=macm4
WorkingDirectory=/Users/macm4/Documents/Projek/NRE
ExecStart=/usr/bin/python3 /Users/macm4/Documents/Projek/NRE/.agents/mcp_server.py
Restart=on-failure
RestartSec=10
Environment="FLASK_ENV=production"
Environment="PROJECT_ROOT=/Users/macm4/Documents/Projek/NRE"

[Install]
WantedBy=multi-user.target
```

**Where to paste**:
- `/etc/systemd/system/nre-mcp.service` (Linux)
- Create with: `sudo nano /etc/systemd/system/nre-mcp.service`
- Then: `sudo systemctl enable nre-mcp && sudo systemctl start nre-mcp`

---

## 7️⃣ Makefile Target Format

```makefile
.PHONY: mcp-start mcp-stop mcp-status mcp-logs

mcp-start:
	cd .agents && python3 mcp_server.py &
	@echo "✅ MCP server started on http://localhost:8888"

mcp-stop:
	pkill -f "python3.*mcp_server.py"
	@echo "✅ MCP server stopped"

mcp-status:
	curl -s http://localhost:8888/health | jq .

mcp-logs:
	tail -f .agents/ALERTS.log

mcp-test:
	curl http://localhost:8888/api/agents | jq .
```

**Where to paste**:
- `Makefile` at project root
- Then run: `make mcp-start`, `make mcp-stop`, etc

---

## 8️⃣ Requirements.txt (for pip install)

```txt
# MCP Server Dependencies
Flask==3.0.0
Werkzeug==3.0.0
python-dotenv==1.0.0
pyyaml==6.0
requests==2.31.0
```

**Where to paste**:
- `requirements-mcp.txt` at project root
- Then install: `pip install -r requirements-mcp.txt`

---

## 9️⃣ Quick Start Shell Script

```bash
#!/bin/bash
# .agents/start-mcp.sh

set -e

PROJECT_ROOT="/Users/macm4/Documents/Projek/NRE"
AGENTS_DIR="$PROJECT_ROOT/.agents"

echo "🚀 Starting NRE MCP Coordinator Server..."
echo "📍 Project: $PROJECT_ROOT"
echo "📍 Port: 8888"
echo ""

cd "$AGENTS_DIR"

# Check if dependencies installed
if ! python3 -c "import flask" 2>/dev/null; then
    echo "⚠️  Flask not found. Installing dependencies..."
    pip install -r "$PROJECT_ROOT/requirements-mcp.txt"
fi

# Start server
export PROJECT_ROOT="$PROJECT_ROOT"
export AGENTS_DIR="$AGENTS_DIR"
export STATE_FILE="$AGENTS_DIR/MCP_STATE.md"
export CONFIG_FILE="$AGENTS_DIR/mcp.config.json"
export ALERTS_FILE="$AGENTS_DIR/ALERTS.log"
export FLASK_ENV="production"

python3 mcp_server.py
```

**Where to paste**:
- `.agents/start-mcp.sh`
- Make executable: `chmod +x .agents/start-mcp.sh`
- Run: `./.agents/start-mcp.sh`

---

## 🔟 GitHub Actions Workflow (CI/CD)

```yaml
name: MCP Server Health Check

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          python -m pip install -r requirements-mcp.txt
      
      - name: Start MCP server
        run: |
          cd .agents
          python3 mcp_server.py &
          sleep 2
      
      - name: Health check
        run: |
          curl -f http://localhost:8888/health
          curl -f http://localhost:8888/api/agents
          curl -f http://localhost:8888/api/state-summary
      
      - name: Report status
        if: failure()
        run: |
          echo "❌ MCP Server health check failed"
          exit 1
```

**Where to paste**:
- `.github/workflows/mcp-health-check.yml`

---

## How to Use These Configs

### Option A: VS Code / IDE Integration
1. Copy config #1 (VS Code format)
2. Paste into VS Code settings
3. MCP server auto-starts with your editor

### Option B: CLI / Terminal
1. Use config #7 (Makefile) or #9 (Shell script)
2. Run: `make mcp-start` or `./.agents/start-mcp.sh`
3. Server starts on http://localhost:8888

### Option C: Docker / Production
1. Copy config #2 (Docker Compose)
2. Add to your `docker-compose.yml`
3. Run: `docker-compose up mcp-server`

### Option D: Always-on Service
1. Copy config #6 (Systemd)
2. Install service: `sudo cp ... /etc/systemd/system/`
3. Enable: `sudo systemctl enable nre-mcp`

---

## Verification After Setup

```bash
# Test MCP is running
curl http://localhost:8888/health

# Get summary
curl http://localhost:8888/api/state-summary

# List agents
curl http://localhost:8888/api/agents

# Check progress
curl http://localhost:8888/api/task-progress
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-30T...",
  "version": "1.0"
}
```

---

**Choose the format that best fits your workflow!** 🚀
