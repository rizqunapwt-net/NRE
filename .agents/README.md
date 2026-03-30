# 🎯 MCP System — Quick Start Guide

## What is MCP?

**Model Context Protocol** = coordination framework untuk 6 AI agents bekerja together pada Rizquna ERP development.

**Goal**: Agents bekerja **parallel**, **synchronized**, **no conflicts**.

---

## 5-Minute Startup

### 1️⃣ Start MCP Server

```bash
cd /Users/macm4/Documents/Projek/NRE/.agents

# Make server executable (one-time)
chmod +x mcp_server.py

# Run server
python3 mcp_server.py
```

**Expected Output**:
```
╔═════════════════════════════════════════════════════╗
║     MCP Server — NRE Multi-Agent Coordination      ║
╚═════════════════════════════════════════════════════╝

🚀 Server running on http://localhost:8888
```

### 2️⃣ Verify Server is Running

```bash
# In another terminal
curl http://localhost:8888/health

# Output:
# {"status": "healthy", "timestamp": "...", "version": "1.0"}
```

### 3️⃣ Check Agent Status

```bash
# Get all agents
curl http://localhost:8888/api/agents

# Get task progress
curl http://localhost:8888/api/task-progress

# Get state summary
curl http://localhost:8888/api/state-summary
```

---

## Documentation Files

**Read in order**:

1. 📋 **MCP_PROTOCOL.md** — How the system works (agents, tasks, communication)
2. 🤝 **AGENT_HANDOFF.md** — How agents hand off work
3. 📊 **MCP_STATE.md** — Current task board & status (MAIN FILE)
4. ⚙️ **mcp.config.json** — Configuration (don't edit manually)

---

## For Each Agent

### Before Starting Work

```bash
# 1. Read the main state file
cat .agents/MCP_STATE.md

# 2. Check dependencies
curl http://localhost:8888/api/dependencies?agent=YOUR_AGENT_ID

# 3. Check for blockers
curl http://localhost:8888/api/blockers
```

### When Claiming a Task

```bash
# Via API
curl -X POST http://localhost:8888/api/claim-task \
  -H "Content-Type: application/json" \
  -d '{"agent": 1, "task": "Fix catalog API"}'

# OR manually update .agents/MCP_STATE.md
# Change: "❌ TODO" → "🔄 IN_PROGRESS"
```

### When Finishing a Task

```bash
# Via API
curl -X POST http://localhost:8888/api/task-done \
  -H "Content-Type: application/json" \
  -d '{
    "agent": 1,
    "task": "Fix catalog API",
    "notes": "Done, tested with curl, Ready for A2 to consume"
  }'

# Then:
# 1. Update .agents/MCP_STATE.md: "❌ TODO" → "✅ DONE"
# 2. Add message to Communication Log in MCP_STATE.md
# 3. git add -A && git commit -m "a1(api): Fix catalog API..."
# 4. git push origin develop
```

---

## Common Workflows

### Workflow: A1 Completes API, A2 Consumes

**Agent 1 (Backend)**:
```bash
# 1. Implement endpoint
# 2. Test locally
# 3. Commit
git commit -m "a1(api): Add /api/v1/public/catalog endpoint"

# 4. Post handoff message to .agents/MCP_STATE.md Communication Log
### [DATE] Agent 1 → Agent 2
**API READY**: GET /api/v1/public/catalog
- Response: { books: [...], pagination: {...} }
- Auth: Public
- Tested: ✅

# 5. Update task status
# ✅ DONE in MCP_STATE.md
```

**Agent 2 (Frontend)**:
```bash
# 1. Receive notification in Communication Log
# 2. Test API endpoint
curl http://localhost:9000/api/v1/public/catalog

# 3. Implement frontend component
# 4. Test integration
# 5. Commit
git commit -m "a2(frontend): Add product carousel using API"

# 6. Post completion message
### [DATE] Agent 2 → All
**LANDING PAGE CAROUSEL READY**:
- Uses API: GET /api/v1/public/catalog
- Component: admin-panel/src/components/ProductCarousel.tsx
- Tested: ✅ Renders correctly
```

### Workflow: A6 Validates Integration

**Agent 6 (QA)**:
```bash
# 1. Run all tests
bash scripts/smoke-test.sh
npm run test:e2e
php artisan test

# 2. Check integration points
curl http://localhost:8888/api/task-progress

# 3. Report issues in Communication Log
### [DATE] Agent 6 → All
**QA VALIDATION REPORT**:
✅ API smoke tests: 20/20 passing
❌ E2E: 3/5 tests failing (missing browser tests)

# 4. Update MCP_STATE.md with findings
```

---

## MCP Server API Reference

### Health & Status

```bash
GET /health
GET /api/agents
GET /api/state-summary
```

### Tasks

```bash
GET /api/task-status?agent=1                    # Get tasks for agent
GET /api/task-progress                           # Overall progress
POST /api/claim-task                             # Agent claims task
POST /api/task-done                              # Agent finish task
```

### Dependencies

```bash
GET /api/dependencies                            # Full dependency graph
GET /api/dependencies?agent=1                    # Dependencies for agent 1
```

### Blockers

```bash
GET /api/blockers                                # Get all blockers
GET /api/blockers?severity=critical              # Get critical only
POST /api/blockers                               # Agent reports blocker
```

### Communication

```bash
POST /api/broadcast                              # Agent broadcasts message
GET /api/comms                                   # Get communication history
GET /api/comms?limit=20                          # Last 20 messages
```

### State

```bash
GET /api/state                                   # Full MCP state
GET /api/state-summary                           # Quick summary
```

---

## Troubleshooting

### Problem: Server won't start

```bash
# Check if port 8888 is already in use
lsof -i :8888

# Kill existing process
kill -9 <PID>

# Try again
python3 mcp_server.py
```

### Problem: Can't find MCP_STATE.md

```bash
# Verify file exists
ls -la .agents/MCP_STATE.md

# If missing, recreate from git
git checkout .agents/MCP_STATE.md
```

### Problem: API returns 404

```bash
# Verify server is running
curl http://localhost:8888/health

# Check endpoint path
# All paths start with /api/ or /health
```

### Problem: Agent can't reach API

```bash
# Backend agent must ensure API is running
# Default: http://localhost:9000
./scripts/dev.sh up

# Frontend agent must test API connection
curl http://localhost:9000/api/v1/public/catalog
```

---

## File Structure

```
.agents/
├── MCP_PROTOCOL.md              # 📋 Protocol docs (READ FIRST)
├── MCP_STATE.md                 # 📊 Main task board (CENTRAL FILE)
├── AGENT_HANDOFF.md             # 🤝 Handoff guidelines
├── README.md                     # 📖 This file
├── mcp_server.py                # 🖥️  MCP server (run to use API)
├── mcp.config.json              # ⚙️  Configuration
├── ALERTS.log                   # 🔔 Server alerts (auto-created)
├── agent-1.md                   # Backend instructions
├── agent-2.md                   # Frontend instructions
├── agent-3.md                   # Admin instructions
├── agent-4.md                   # DevOps instructions
├── agent-5.md                   # Library instructions
└── agent-6.md                   # QA instructions
```

---

## Next Steps

1. ✅ **Read**: MCP_PROTOCOL.md (5 min)
2. ✅ **Start**: MCP Server (`python3 mcp_server.py`)
3. ✅ **Check**: Agent status (`curl http://localhost:8888/api/agents`)
4. ✅ **Read**: Relevant agent file (agent-1.md, agent-2.md, etc)
5. ✅ **Work**: Update tasks in MCP_STATE.md
6. ✅ **Communicate**: Use Communication Log for handoffs

---

## Success Metrics

✅ MCP working well if:
- All agents can check task status in real-time
- Handoffs documented & traceable
- No code conflicts at merge time
- No blocking dependencies
- QA can validate smooth integration
- Main branch stays stable

---

**Support**: Check `.agents/ALERTS.log` for diagnostics  
**Questions**: Ask in Communication Log (MCP_STATE.md)

🚀 **Ready to coordinate!**
