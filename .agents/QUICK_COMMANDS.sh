#!/bin/bash
# MCP Quick Commands Script
# Copy-paste ready shell commands for MCP operations

echo """
╔════════════════════════════════════════════════╗
║   NRE MCP Server — Quick Commands Cheat Sheet  ║
╚════════════════════════════════════════════════╝
"""

# ===== SETUP =====
echo "
📦 SETUP
─────────────────────────────────────────────────"
echo "
# Start MCP Server
cd /Users/macm4/Documents/Projek/NRE/.agents
python3 mcp_server.py

# Stop MCP Server
pkill -f 'python3.*mcp_server.py'

# Check if port 8888 in use
lsof -i :8888
"

# ===== HEALTH CHECKS =====
echo "
🏥 HEALTH CHECKS
─────────────────────────────────────────────────"
echo "
# Basic health check
curl http://localhost:8888/health

# Pretty print
curl -s http://localhost:8888/health | jq .

# Get agents
curl http://localhost:8888/api/agents

# Get progress
curl http://localhost:8888/api/task-progress | jq .

# Get summary
curl -s http://localhost:8888/api/state-summary | jq .
"

# ===== AGENT OPERATIONS =====
echo "
🤖 AGENT OPERATIONS
─────────────────────────────────────────────────"
echo "
# Get task status for Agent 1
curl 'http://localhost:8888/api/task-status?agent=1'

# Claim a task (Agent 1)
curl -X POST http://localhost:8888/api/claim-task \
  -H 'Content-Type: application/json' \
  -d '{\"agent\": 1, \"task\": \"Fix catalog API\"}'

# Complete a task (Agent 1)
curl -X POST http://localhost:8888/api/task-done \
  -H 'Content-Type: application/json' \
  -d '{\"agent\": 1, \"task\": \"Fix catalog API\", \"notes\": \"Ready for A2\"}'

# Report blocker (Agent 2 blocked by Agent 1)
curl -X POST http://localhost:8888/api/blockers \
  -H 'Content-Type: application/json' \
  -d '{\"agent\": 2, \"title\": \"Waiting for API\", \"blocked_by\": 1}'
"

# ===== DEPENDENCIES =====
echo "
🔗 DEPENDENCIES
─────────────────────────────────────────────────"
echo "
# Get full dependency graph
curl http://localhost:8888/api/dependencies | jq .

# Get dependencies for Agent 2
curl 'http://localhost:8888/api/dependencies?agent=2'

# Get blockers
curl http://localhost:8888/api/blockers

# Get critical blockers only
curl 'http://localhost:8888/api/blockers?severity=critical'
"

# ===== COMMUNICATION =====
echo "
💬 COMMUNICATION
─────────────────────────────────────────────────"
echo "
# Broadcast message (Agent 1 → All)
curl -X POST http://localhost:8888/api/broadcast \
  -H 'Content-Type: application/json' \
  -d '{
    \"from\": 1,
    \"to\": \"all\",
    \"message\": \"API ready: GET /api/v1/public/catalog\"
  }'

# Get communication history
curl http://localhost:8888/api/comms | jq .

# Get last 20 messages
curl 'http://localhost:8888/api/comms?limit=20' | jq .

# Get alerts log
tail -f .agents/ALERTS.log

# Follow alerts live
while true; do tail -n 1 .agents/ALERTS.log; sleep 1; done
"

# ===== FILE OPERATIONS =====
echo "
📂 FILE OPERATIONS
─────────────────────────────────────────────────"
echo "
# Read MCP state
cat .agents/MCP_STATE.md

# Update task status
nano .agents/MCP_STATE.md  # or vim

# Check config
cat .agents/mcp.config.json | jq .

# View alerts
cat .agents/ALERTS.log

# Clear alerts (reset)
> .agents/ALERTS.log

# Git operations
cd /Users/macm4/Documents/Projek/NRE

# Check status
git status

# Commit changes
git add -A
git commit -m 'a1(api): Task description here'
git push origin develop
"

# ===== TESTING =====
echo "
🧪 TESTING
─────────────────────────────────────────────────"
echo "
# Test all endpoints (quick)
bash -c '
  echo \"Testing MCP Server...\"
  curl -s http://localhost:8888/health | jq .status
  curl -s http://localhost:8888/api/agents | jq .count
  curl -s http://localhost:8888/api/task-progress | jq .completion_percent
  echo \"All tests passed! ✅\"
'

# Load test (basic)
ab -n 100 -c 10 http://localhost:8888/health
"

# ===== USEFUL ALIASES =====
echo "
🎯 ADD THESE TO ~/.zshrc OR ~/.bashrc
─────────────────────────────────────────────────"
echo "
alias mcp-start='cd /Users/macm4/Documents/Projek/NRE/.agents && python3 mcp_server.py'
alias mcp-stop='pkill -f \"python3.*mcp_server.py\"'
alias mcp-health='curl -s http://localhost:8888/health | jq .'
alias mcp-status='curl -s http://localhost:8888/api/agents | jq .'
alias mcp-progress='curl -s http://localhost:8888/api/task-progress | jq .'
alias mcp-logs='tail -f /Users/macm4/Documents/Projek/NRE/.agents/ALERTS.log'
alias mcp-state='cat /Users/macm4/Documents/Projek/NRE/.agents/MCP_STATE.md | less'

# Then use:
# mcp-start
# mcp-health
# mcp-progress
# etc.
"

# ===== DOCKER COMMANDS =====
echo "
🐳 DOCKER (if using Docker)
─────────────────────────────────────────────────"
echo "
# Build MCP image
docker build -f Dockerfile.mcp -t nre-mcp:latest .

# Run MCP container
docker run -p 8888:8888 \\
  -v /Users/macm4/Documents/Projek/NRE:/app \\
  nre-mcp:latest

# Docker compose (add to docker-compose.yml first)
docker-compose up mcp-server
docker-compose logs -f mcp-server
"

# ===== DEBUGGING =====
echo "
🐛 DEBUGGING
─────────────────────────────────────────────────"
echo "
# Check Python version
python3 --version

# Test Flask import
python3 -c 'import flask; print(flask.__version__)'

# Check if port in use
lsof -i :8888

# Kill specific process
kill -9 <PID>

# Check MCP server process
ps aux | grep mcp_server

# Monitor in real-time
watch -n 1 'curl -s http://localhost:8888/api/task-progress | jq .'

# Check file permissions
ls -la .agents/mcp_server.py

# Make executable
chmod +x .agents/mcp_server.py
"

# ===== QUICK WORKFLOW EXAMPLE =====
echo "
⚡ QUICK WORKFLOW EXAMPLE
─────────────────────────────────────────────────
Agent 1 finishes API → Agent 2 consumes:

# Agent 1
1. Do work on API
2. Test locally: curl http://localhost:9000/api/v1/public/catalog
3. Commit: git commit -m 'a1(api): Add catalog endpoint'
4. Report: curl -X POST http://localhost:8888/api/task-done \\
     -H 'Content-Type: application/json' \\
     -d '{\"agent\": 1, \"task\": \"Add API endpoint\", \"notes\": \"Ready\"}'

# Agent 2
1. Check dependencies: curl http://localhost:8888/api/dependencies?agent=2
2. Read Communication Log in MCP_STATE.md
3. Test API: curl http://localhost:9000/api/v1/public/catalog
4. Build frontend component
5. Test integration locally
6. Commit: git commit -m 'a2(frontend): Add catalog with API integration'
7. Report: curl -X POST http://localhost:8888/api/task-done ...
"

echo """
═════════════════════════════════════════════════
             Need Help?
─────────────────────────────────────────────────
📖 Read: .agents/README.md
📋 Read: .agents/MCP_PROTOCOL.md
🤝 Read: .agents/AGENT_HANDOFF.md
📊 Check: .agents/MCP_STATE.md

✨ Keep Learning!
═════════════════════════════════════════════════
"""
