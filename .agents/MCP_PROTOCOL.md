# 📋 MCP Protocol — NRE Multi-Agent Framework

> **Model Context Protocol** implementation untuk koordinasi 6 AI agents dalam Rizquna ERP development.

## Overview

**Tujuan**: Memastikan 6 agents (Backend, Frontend, Admin, DevOps, Library, QA) bekerja **synchronized** tanpa konflik, tumpang tindih, atau blocking.

**Mekanisme**: File-based coordination + Python MCP server + shared knowledge base.

---

## 1. Agent Definitions

### Core Agents

| ID | Agent Name | Domain | Owner | Status |
|----|------------|--------|-------|--------|
| **A1** | Backend Core | Laravel API, Database, Auth | `Agent 1` | ✅ 7/7 DONE |
| **A2** | Frontend Public | React Landing, Catalog | `Agent 2` | ✅ 7/7 DONE |
| **A3** | Admin Panel | Dashboard, CRUD, Royalties | `Agent 3` | ✅ 5/5 DONE |
| **A4** | DevOps | Docker, Nginx, CI/CD, Deploy | `Agent 4` | ✅ 6/6 DONE |
| **A5** | Digital Library | Cover Serving, PDF, Downloads | `Agent 5` | ✅ 7/7 DONE |
| **A6** | QA & Testing | Tests, Seeders, Validation | `Agent 6` | ⚠️ 3/5 PARTIAL |

### Responsibilities Matrix

```
                  | Backend | Frontend | Admin | DevOps | Library | QA |
├─app/            |   ✅    |    ❌    |  ❌   |   ❌   |   ❌    | ✅ |
├─admin-panel/    |   ❌    |    ✅    |  ✅   |   ❌   |   ❌    | ✅ |
├─database/       |   ✅    |    ❌    |  ❌   |   ❌   |   ❌    | ✅ |
├─docker/         |   ❌    |    ❌    |  ❌   |   ✅   |   ❌    | ❌ |
├─scripts/        |   ❌    |    ❌    |  ❌   |   ✅   |   ❌    | ❌ |
├─storage/        |   ✅    |    ❌    |  ❌   |   ❌   |   ✅    | ✅ |
├─routes/         |   ✅    |    ❌    |  ❌   |   ❌   |   ❌    | ❌ |
├─tests/          |   ✅    |    ✅    |  ✅   |   ❌   |   ❌    | ✅ |
├─.github/        |   ❌    |    ❌    |  ❌   |   ✅   |   ❌    | ❌ |
```

---

## 2. Communication Protocol

### 2.1 Synchronous Communication (File-Based)

**Primary Channel**: `.agents/MCP_STATE.md`

**Rules:**
- ✅ **ONE source-of-truth** untuk task status, blockers, dependencies
- ✅ **ALL** agents membaca sebelum mulai
- ✅ **ALL** agents update setelah selesai task
- ✅ **Communication Log** untuk notifikasi antar agent

**Format Update:**
```markdown
### [TIMESTAMP] Agent X → Agent Y (or All)
**TITLE**: Brief summary
- Detail 1
- Detail 2
... (any changes, blockers, request for feedback)
```

### 2.2 Asynchronous Communication (Python MCP Server)

**Running**:
```bash
cd .agents && python3 mcp_server.py
```

**APIs**:
```bash
# Query task status
curl http://localhost:8888/api/task-status?agent=1

# Report blockers
curl -X POST http://localhost:8888/api/blockers \
  -H "Content-Type: application/json" \
  -d '{"agent": 1, "title": "...", "description": "..."}'

# Get dependencies tree
curl http://localhost:8888/api/dependencies

# Broadcast message
curl -X POST http://localhost:8888/api/broadcast \
  -H "Content-Type: application/json" \
  -d '{"from": 1, "to": "all", "message": "..."}'
```

---

## 3. Task Management

### 3.1 Task Lifecycle

```
[BACKLOG]
    ↓
[TODO] → Agent claimed → [IN_PROGRESS]
    ↓
[BLOCKED] (if dependency issue)
    ↓
[DONE] → Update MCP_STATE.md + Communication Log
    ↓
[VERIFIED] (Agent 6 QA checks)
```

### 3.2 Task Format in MCP_STATE.md

```markdown
| Task Name | Status | Owner | Dependencies | Notes |
|-----------|--------|-------|--------------|-------|
| Task A | ✅ DONE | A1 | — | Completed 2026-03-15 |
| Task B | ⚠️ BLOCKED | A2 | A1 (waiting for API) | Needs XYZ from A1 |
| Task C | 🔄 IN_PROGRESS | A3 | A1 (API), A4 (Docker) | 50% complete |
| Task D | ❌ TODO | — | A4 (deployment) | Ready when A4 done |
```

---

## 4. Dependency Management

### 4.1 Dependency Graph

**Critical Path:**
```
A1 (Backend API)
  ├→ A2 (Frontend) — needs API endpoints
  ├→ A3 (Admin) — needs API + roles
  ├→ A5 (Library) — needs storage service
  └→ A6 (QA) — needs all to test

A4 (DevOps) — independent, supports all

A6 (QA) — last, validates all
```

### 4.2 Blocking Rules

**Agent CANNOT start** jika:
- ❌ Dependencies tidak selesai
- ❌ API changes tidak tersedia
- ❌ Blocking error dari agent lain
- ❌ Database schema berubah tanpa notification

**Agent HARUS notify** ketika:
- ✅ Task selesai yang diminta agent lain
- ✅ API endpoint baru ready
- ✅ Schema/model berubah
- ✅ Breaking change ke API

---

## 5. Conflict Resolution

### 5.1 File Conflict (Code Level)

**Kapan conflict terjadi:**
- Dua agent edit file yang sama
- GitHub merge conflict

**Resolution:**
1. **Agent pemilik file** punya priority (lihat Responsibilities Matrix)
2. **Agent lain** harus coordinate via Communication Log
3. **Owner** merge dengan careful review

### 5.2 Logic Conflict (Design Level)

**Kapan terjadi:**
- API design vs Frontend expectation berbeda
- Database schema interpretation berbeda

**Resolution Process:**
1. Agent yang conflict **post di Communication Log** dengan:
   - Apa yang conflict
   - Proposal resolusi
   - Deadline untuk feedback
2. **Owner domain** punya final say
3. **MCP_STATE.md gotchas** updated

---

## 6. Integration Points

### 6.1 Agent 1 → Agent 2 (API → Frontend)

**Handoff:**
- ✅ A1 creates API endpoint
- ✅ A1 notifies A2 with endpoint spec (URL, response format, auth)
- ❌ A2 CANNOT start until A1 confirms endpoint ready
- ✅ A2 implements frontend using spec
- ✅ A6 smoke tests integration

**Format:**
```markdown
### [DATE] Agent 1 → Agent 2
**API READY**: /api/v1/public/catalog
- GET /api/v1/public/catalog?category={id}&page={n}
- Response: { books: [...], pagination: {...} }
- Auth: Public (no token needed)
```

### 6.2 Agent 1 → Agent 3, 5 (API → Admin & Library)

Same as above, A1 notifies A3 & A5 of endpoint availability.

### 6.3 Agent 4 → All (Infrastructure)

DevOps provides:
- ✅ Docker setup (all agents use)
- ✅ Deployment target (production)
- ✅ CI/CD pipeline (all push to this)

**Notification Format:**
```markdown
### [DATE] Agent 4 → All
**INFRA READY**:
- Docker: docker-compose.yml (port 9000 API, 4000 frontend)
- Deploy: scripts/deploy.sh (production ready)
```

### 6.4 Agent 6 → All (Validation)

A6 tests all integration points:
- ✅ API smoke tests (all A1 endpoints)
- ✅ Frontend works with API (A2 + A1)
- ✅ Admin panel CRUD (A3 + A1)
- ✅ Data integrity (all + database)
- ✅ E2E browser tests (full flow)

**Report Format:**
```markdown
### [DATE] Agent 6 → All
**QA REPORT**:
✅ API smoke tests: 20/20 passing
✅ Frontend integration: No errors
❌ E2E tests: 3/5 browser tests missing
...
```

---

## 7. Version Control Integration

### 7.1 Branching Strategy

```
main (production)
  ├→ develop (staging)
  │   ├→ feature/agent-1-* (A1 features)
  │   ├→ feature/agent-2-* (A2 features)
  │   └→ ...
  └→ hotfix/critical-bugs
```

### 7.2 Commit Convention

```
Format: <agent>(<domain>): <description>

Examples:
- a1(api): Fix catalog endpoint slug handling
- a2(frontend): Add SEO meta tags to landing page
- a3(admin): Implement royalty approval workflow
- a4(devops): Update docker-compose for production
- a5(library): Add PDF preview streaming
- a6(qa): Expand E2E browser tests
```

### 7.3 Review Process

**Code CANNOT merge** tanpa:
- ✅ Domain owner approval (dari Responsibilities Matrix)
- ✅ CLA signed (if external contributor)
- ✅ Tests passing (A6 CI/CD)
- ✅ MCP_STATE.md updated (task status)

---

## 8. Monitoring & Health Checks

### 8.1 MCP Server Endpoints

```bash
# Health check
curl http://localhost:8888/health

# Agent status (all)
curl http://localhost:8888/api/agents

# Task progress
curl http://localhost:8888/api/progress

# Blockers (critical)
curl http://localhost:8888/api/blockers?severity=critical

# Last 10 communications
curl http://localhost:8888/api/comms?limit=10
```

### 8.2 Automated Alerts

**MCP server sends alert Kapan:**
- ⚠️ Agent offline > 1 hour
- ⚠️ Task blocked > 2 hours
- ⚠️ Dependency broken (A1 down, A2 blocked)
- ⚠️ Test failure in deploy pipeline
- ⚠️ Critical blocker reported

**Alert goes to**: `.agents/ALERTS.log`

---

## 9. Running MCP System

### 9.1 Quick Start

```bash
# 1. Start MCP server
cd /Users/macm4/Documents/Projek/NRE/.agents
python3 mcp_server.py

# 2. In another terminal, check status
curl http://localhost:8888/api/agents

# 3. Invoke agent (example: get Agent 1 tasks)
curl http://localhost:8888/api/task-status?agent=1
```

### 9.2 Agent Workflow (Each Agent)

```bash
# 1. Read MCP_STATE.md FIRST
cat .agents/MCP_STATE.md

# 2. Check dependencies
curl http://localhost:8888/api/dependencies

# 3. Claim task (update MCP_STATE.md manually or via API)
# (If using API)
curl -X POST http://localhost:8888/api/claim-task \
  -H "Content-Type: application/json" \
  -d '{"agent": 1, "task": "Fix catalog API"}'

# 4. Do the work...

# 5. Report completion
curl -X POST http://localhost:8888/api/task-done \
  -H "Content-Type: application/json" \
  -d '{"agent": 1, "task": "Fix catalog API", "notes": "Done, needs A2 to test"}'

# 6. Commit code
git add -A && git commit -m "a1(api): Fix catalog API slug handling"
git push origin develop
```

---

## 10. Troubleshooting

### Problem: Agent Blocked (Waiting for Dependency)

**Solution:**
1. Check MCP_STATE.md `Communication Log` untuk status dependency
2. Query MCP server: `curl http://localhost:8888/api/dependencies?agent=X`
3. File blocker report: `curl -X POST http://localhost:8888/api/blockers -d '...'`
4. Wait atau negotiate with blocking agent

### Problem: Code Conflict

**Solution:**
1. Both agents post di Communication Log
2. **Domain owner** merges dengan careful
3. Update MCP_STATE.md gotchas jika perlu
4. Rerun tests (A6)

### Problem: API Changes Break Frontend

**Solution:**
1. A1 posts breaking change di Communication Log
2. A2 updates expectations, adapts code
3. A1 & A2 coordinate timeline
4. Both update their tests
5. A6 validate integration

### Problem: MCP Server Down

**Solution:**
```bash
# Kill old process
pkill -f mcp_server

# Restart
cd .agents && python3 mcp_server.py

# Verify
curl http://localhost:8888/health
```

---

## 11. Success Criteria

**MCP System berhasil** jika:
- ✅ All 6 agents deliver without blockers
- ✅ Zero unplanned code conflicts
- ✅ All dependencies resolved cleanly
- ✅ Communication clear & timestamped
- ✅ No breaking changes surprise frontend
- ✅ QA (A6) can validate full integration
- ✅ Main branch stable for production

---

**Last Updated**: 2026-03-30  
**Maintainer**: System Admin  
**Version**: 1.0
