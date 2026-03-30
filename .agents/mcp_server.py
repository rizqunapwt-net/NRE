#!/usr/bin/env python3
"""
MCP Server for NRE (Rizquna ERP) Multi-Agent Coordination
Provides REST API for agent coordination, task management, and communication
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path
from flask import Flask, jsonify, request
from functools import wraps
import threading
import yaml

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Paths
PROJECT_ROOT = Path(os.getenv('PROJECT_ROOT', Path(__file__).parent.parent))
AGENTS_DIR = Path(os.getenv('AGENTS_DIR', PROJECT_ROOT / '.agents'))
STATE_FILE = Path(os.getenv('STATE_FILE', AGENTS_DIR / 'MCP_STATE.md'))
CONFIG_FILE = Path(os.getenv('CONFIG_FILE', AGENTS_DIR / 'mcp.config.json'))
ALERTS_FILE = Path(os.getenv('ALERTS_FILE', AGENTS_DIR / 'ALERTS.log'))

# Agent definitions (SCALABLE - add more as needed)
AGENTS = {
    1: {"name": "Backend Core", "color": "🔵", "domain": "Laravel API"},
    2: {"name": "Frontend Public", "color": "🟢", "domain": "React Public"},
    3: {"name": "Admin Panel", "color": "🟡", "domain": "Admin Dashboard"},
    4: {"name": "DevOps", "color": "🔴", "domain": "Docker & Deploy"},
    5: {"name": "Digital Library", "color": "🟣", "domain": "Books Storage"},
    6: {"name": "QA & Testing", "color": "🟠", "domain": "Tests & Validation"},
    7: {"name": "Analytics & Monitoring", "color": "🔷", "domain": "Logging & Metrics"},
    8: {"name": "Security & Auth", "color": "⬛", "domain": "Security"},
    9: {"name": "Performance & Optimization", "color": "🟩", "domain": "Speed & Scale"},
    10: {"name": "Documentation", "color": "📘", "domain": "Docs & Wiki"},
    # Add more agents as needed - just increment ID and define properties
}


def load_config():
    """Load MCP configuration"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE) as f:
            return json.load(f)
    return {"version": "1.0", "agents": AGENTS, "status": "running"}


def save_config(config):
    """Save MCP configuration"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f, indent=2)


def log_alert(level, message):
    """Log alert to ALERTS.log"""
    timestamp = datetime.now().isoformat()
    log_entry = f"[{timestamp}] {level}: {message}\n"
    with open(ALERTS_FILE, 'a') as f:
        f.write(log_entry)


def read_state():
    """Read MCP_STATE.md and parse task data"""
    if not STATE_FILE.exists():
        return {"error": "MCP_STATE.md not found"}
    
    try:
        with open(STATE_FILE) as f:
            content = f.read()
        return {"raw": content, "path": str(STATE_FILE), "timestamp": os.path.getmtime(STATE_FILE)}
    except Exception as e:
        log_alert("ERROR", f"Failed to read state: {str(e)}")
        return {"error": str(e)}


def require_json(f):
    """Decorator to validate JSON request"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.is_json:
            return jsonify({"error": "Content-Type must be application/json"}), 400
        return f(*args, **kwargs)
    return decorated_function


# ===== HEALTH & STATUS =====

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0",
        "mcp_state": STATE_FILE.exists(),
    }), 200


@app.route('/api/agents', methods=['GET'])
def get_agents():
    """Get all agents and their status"""
    config = load_config()
    return jsonify({
        "agents": AGENTS,
        "count": len(AGENTS),
        "last_updated": datetime.now().isoformat(),
    }), 200


# ===== TASK MANAGEMENT =====

@app.route('/api/task-status', methods=['GET'])
def task_status():
    """Get task status for a specific agent"""
    agent_id = request.args.get('agent', type=int)
    
    if agent_id and agent_id not in AGENTS:
        return jsonify({"error": f"Agent {agent_id} not found"}), 404
    
    state = read_state()
    if "error" in state:
        return jsonify(state), 500
    
    return jsonify({
        "agent": agent_id,
        "agent_name": AGENTS.get(agent_id, {}).get("name"),
        "state_file": state.get("path"),
        "note": "Parse MCP_STATE.md for full task details",
    }), 200


@app.route('/api/task-progress', methods=['GET'])
def task_progress():
    """Get overall task completion percentage"""
    state = read_state()
    if "error" in state:
        return jsonify(state), 500
    
    # Quick heuristic: count ✅ DONE vs total tasks
    raw_content = state.get("raw", "")
    done_count = raw_content.count("✅ DONE")
    todo_count = raw_content.count("❌ TODO")
    blocked_count = raw_content.count("⚠️ BLOCKED")
    
    total = done_count + todo_count + blocked_count
    progress = (done_count / total * 100) if total > 0 else 0
    
    return jsonify({
        "completion_percent": round(progress, 1),
        "done": done_count,
        "todo": todo_count,
        "blocked": blocked_count,
        "total": total,
    }), 200


@app.route('/api/claim-task', methods=['POST'])
@require_json
def claim_task():
    """Agent claims a task"""
    data = request.get_json()
    agent_id = data.get('agent')
    task_name = data.get('task')
    
    if not agent_id or not task_name:
        return jsonify({"error": "Missing 'agent' or 'task' field"}), 400
    
    if agent_id not in AGENTS:
        return jsonify({"error": f"Agent {agent_id} not found"}), 404
    
    log_alert(
        "INFO",
        f"Agent {agent_id} ({AGENTS[agent_id]['name']}) claimed task: {task_name}"
    )
    
    return jsonify({
        "status": "claimed",
        "agent": agent_id,
        "task": task_name,
        "timestamp": datetime.now().isoformat(),
    }), 200


@app.route('/api/task-done', methods=['POST'])
@require_json
def task_done():
    """Agent reports task completion"""
    data = request.get_json()
    agent_id = data.get('agent')
    task_name = data.get('task')
    notes = data.get('notes', '')
    
    if not agent_id or not task_name:
        return jsonify({"error": "Missing 'agent' or 'task' field"}), 400
    
    if agent_id not in AGENTS:
        return jsonify({"error": f"Agent {agent_id} not found"}), 404
    
    log_alert(
        "INFO",
        f"Agent {agent_id} ({AGENTS[agent_id]['name']}) completed: {task_name} — {notes}"
    )
    
    return jsonify({
        "status": "done",
        "agent": agent_id,
        "task": task_name,
        "notes": notes,
        "timestamp": datetime.now().isoformat(),
        "next_step": "Update MCP_STATE.md and Communication Log manually",
    }), 200


# ===== BLOCKERS & DEPENDENCIES =====

@app.route('/api/blockers', methods=['GET'])
def get_blockers():
    """Get all active blockers"""
    severity = request.args.get('severity', 'all')  # all, critical, warning
    
    return jsonify({
        "blockers": [],
        "critical": 0,
        "warnings": 0,
        "note": "Check MCP_STATE.md Communication Log for details",
    }), 200


@app.route('/api/blockers', methods=['POST'])
@require_json
def report_blocker():
    """Agent reports a blocker"""
    data = request.get_json()
    agent_id = data.get('agent')
    title = data.get('title')
    description = data.get('description', '')
    blocked_by = data.get('blocked_by')  # which agent(s)
    
    if not agent_id or not title:
        return jsonify({"error": "Missing 'agent' or 'title' field"}), 400
    
    if agent_id not in AGENTS:
        return jsonify({"error": f"Agent {agent_id} not found"}), 404
    
    log_alert(
        "WARNING",
        f"Agent {agent_id} BLOCKED: {title} (blocked by: {blocked_by}) — {description}"
    )
    
    return jsonify({
        "status": "recorded",
        "agent": agent_id,
        "title": title,
        "blocked_by": blocked_by,
        "timestamp": datetime.now().isoformat(),
        "next_step": "Update MCP_STATE.md with ⚠️ BLOCKED status",
    }), 201


@app.route('/api/dependencies', methods=['GET'])
def get_dependencies():
    """Get dependency graph"""
    agent_id = request.args.get('agent', type=int)
    
    # SCALABLE dependency graph - dynamically built
    deps = {
        1: {"depends_on": [], "enables": [2, 3, 5, 6]},           # Backend enables all
        2: {"depends_on": [1], "enables": []},                     # Frontend needs Backend
        3: {"depends_on": [1], "enables": []},                     # Admin needs Backend
        4: {"depends_on": [], "enables": [6]},                     # DevOps independent
        5: {"depends_on": [1], "enables": []},                     # Library needs Backend
        6: {"depends_on": [1, 2, 3, 5], "enables": []},            # QA needs all
        7: {"depends_on": [1, 6], "enables": []},                  # Analytics needs Backend + QA
        8: {"depends_on": [1], "enables": [2, 3, 6]},              # Auth enables Frontend & Admin
        9: {"depends_on": [4, 6], "enables": []},                  # Optimization needs DevOps + QA
        10: {"depends_on": [1, 2, 3, 4, 5, 6], "enables": []},     # Docs depend on all
    }
    
    if agent_id and agent_id not in AGENTS:
        return jsonify({"error": f"Agent {agent_id} not found"}), 404
    
    result = deps.get(agent_id, deps) if agent_id else deps
    
    return jsonify({
        "agent": agent_id,
        "dependencies": result,
        "critical_path": "Backend (A1) → Frontend/Admin/Library (A2/A3/A5) → QA (A6)",
        "total_agents": len(AGENTS),
    }), 200


# ===== COMMUNICATION =====

@app.route('/api/broadcast', methods=['POST'])
@require_json
def broadcast():
    """Broadcast message to other agents"""
    data = request.get_json()
    from_agent = data.get('from')
    to_agent = data.get('to')  # 'all' or agent_id
    message = data.get('message')
    
    if not from_agent or not message:
        return jsonify({"error": "Missing 'from' or 'message' field"}), 400
    
    if from_agent not in AGENTS:
        return jsonify({"error": f"Agent {from_agent} not found"}), 404
    
    log_alert(
        "COMMS",
        f"Agent {from_agent} → {to_agent}: {message}"
    )
    
    return jsonify({
        "status": "broadcast",
        "from": from_agent,
        "to": to_agent,
        "message": message,
        "timestamp": datetime.now().isoformat(),
        "next_step": "Add message to MCP_STATE.md Communication Log",
    }), 201


@app.route('/api/comms', methods=['GET'])
def get_comms():
    """Get communication history from ALERTS.log"""
    limit = request.args.get('limit', 10, type=int)
    
    if not ALERTS_FILE.exists():
        return jsonify({"comms": [], "count": 0}), 200
    
    with open(ALERTS_FILE) as f:
        lines = f.readlines()
    
    # Get last N lines
    recent = lines[-limit:] if len(lines) > limit else lines
    
    return jsonify({
        "comms": recent,
        "count": len(recent),
        "total_log_lines": len(lines),
    }), 200


# ===== STATE & SYNC =====

@app.route('/api/state', methods=['GET'])
def get_state():
    """Get full MCP state from MCP_STATE.md"""
    state = read_state()
    return jsonify(state), 200


@app.route('/api/state-summary', methods=['GET'])
def get_state_summary():
    """Get quick summary of project state"""
    state = read_state()
    if "error" in state:
        return jsonify(state), 500
    
    raw = state.get("raw", "")
    
    summary = {
        "environment": "Development (Docker on Mac Mini M4)",
        "api_server": "http://localhost:9000",
        "frontend_dev": "http://localhost:4000",
        "database": "PostgreSQL 16 (Docker, port 5435)",
        "redis": "Docker (port 6381)",
        "tasks_done": raw.count("✅ DONE"),
        "tasks_todo": raw.count("❌ TODO"),
        "tasks_blocked": raw.count("⚠️ BLOCKED"),
        "project_status": "95% Complete",
        "last_mcp_update": datetime.fromtimestamp(state.get('timestamp', 0)).isoformat(),
    }
    
    return jsonify(summary), 200


# ===== ERROR HANDLERS =====

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    log_alert("ERROR", f"Internal server error: {str(error)}")
    return jsonify({"error": "Internal server error"}), 500


# ===== MCP PROTOCOL (STDIO) =====

def mcp_respond(response_id, result=None, error=None):
    """Send JSON-RPC response to stdout"""
    response = {"jsonrpc": "2.0", "id": response_id}
    if result is not None:
        response["result"] = result
    if error is not None:
        response["error"] = error
    
    sys.stdout.write(json.dumps(response) + "\n")
    sys.stdout.flush()


def handle_mcp_request(request_data):
    """Process incoming MCP JSON-RPC request"""
    try:
        req = json.loads(request_data)
    except json.JSONDecodeError:
        return

    method = req.get("method")
    req_id = req.get("id")

    if method == "initialize":
        mcp_respond(req_id, {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "serverInfo": {
                "name": "nre-coordinator",
                "version": "1.0.0"
            }
        })
    
    elif method == "tools/list":
        mcp_respond(req_id, {
            "tools": [
                {
                    "name": "get_agents",
                    "description": "List all 10 agents and their domains",
                    "inputSchema": {"type": "object", "properties": {}}
                },
                {
                    "name": "get_task_progress",
                    "description": "Get overall project completion percentage",
                    "inputSchema": {"type": "object", "properties": {}}
                },
                {
                    "name": "get_state_summary",
                    "description": "Get quick summary of project state and environment",
                    "inputSchema": {"type": "object", "properties": {}}
                },
                {
                    "name": "get_dependencies",
                    "description": "Get dependency graph for agents",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "agent": {"type": "integer", "description": "Optional agent ID (1-10)"}
                        }
                    }
                },
                {
                    "name": "claim_task",
                    "description": "Mark a task as claimed by an agent",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "agent": {"type": "integer", "description": "Agent ID (1-10)"},
                            "task": {"type": "string", "description": "Task description"}
                        },
                        "required": ["agent", "task"]
                    }
                },
                {
                    "name": "report_blocker",
                    "description": "Report a blocker that prevents progress",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "agent": {"type": "integer", "description": "Agent ID reporting"},
                            "title": {"type": "string", "description": "Short title of blocker"},
                            "description": {"type": "string", "description": "Detailed description"},
                            "blocked_by": {"type": "string", "description": "Agent or reason blocking"}
                        },
                        "required": ["agent", "title"]
                    }
                }
            ]
        })
    
    elif method == "tools/call":
        params = req.get("params", {})
        tool_name = params.get("name")
        args = params.get("arguments", {})
        
        result_content = []
        
        if tool_name == "get_agents":
            data = AGENTS
            result_content.append({"type": "text", "text": json.dumps(data, indent=2)})
        
        elif tool_name == "get_task_progress":
            state = read_state()
            if "error" in state:
                result_content.append({"type": "text", "text": f"Error: {state['error']}"})
            else:
                raw = state.get("raw", "")
                done = raw.count("✅ DONE")
                todo = raw.count("❌ TODO")
                blocked = raw.count("⚠️ BLOCKED")
                total = done + todo + blocked
                progress = (done / total * 100) if total > 0 else 0
                result_content.append({"type": "text", "text": f"Progress: {progress:.1f}%\nDone: {done}\nTodo: {todo}\nBlocked: {blocked}"})
        
        elif tool_name == "get_state_summary":
            state = read_state()
            raw = state.get("raw", "") if "raw" in state else ""
            summary = {
                "tasks_done": raw.count("✅ DONE"),
                "tasks_todo": raw.count("❌ TODO"),
                "tasks_blocked": raw.count("⚠️ BLOCKED"),
                "project_status": "95% Complete",
                "environment": "Development (Mac Mini M4)"
            }
            result_content.append({"type": "text", "text": json.dumps(summary, indent=2)})
            
        elif tool_name == "get_dependencies":
            agent_id = args.get("agent")
            # Reuse existing logic (hardcoded in this script)
            deps = {
                1: {"depends_on": [], "enables": [2, 3, 5, 6]},
                2: {"depends_on": [1], "enables": []},
                3: {"depends_on": [1], "enables": []},
                4: {"depends_on": [], "enables": [6]},
                5: {"depends_on": [1], "enables": []},
                6: {"depends_on": [1, 2, 3, 5], "enables": []}
            }
            result = deps.get(agent_id, deps) if agent_id else deps
            result_content.append({"type": "text", "text": json.dumps(result, indent=2)})
            
        elif tool_name == "claim_task":
            agent_id = args.get("agent")
            task_name = args.get("task")
            if agent_id in AGENTS:
                log_alert("INFO", f"Agent {agent_id} claimed task: {task_name}")
                result_content.append({"type": "text", "text": f"Task '{task_name}' claimed by {AGENTS[agent_id]['name']}"})
            else:
                result_content.append({"type": "text", "text": f"Error: Agent {agent_id} not found"})
                
        elif tool_name == "report_blocker":
            agent_id = args.get("agent")
            title = args.get("title")
            desc = args.get("description", "")
            blocked_by = args.get("blocked_by", "unknown")
            if agent_id in AGENTS:
                log_alert("WARNING", f"Agent {agent_id} BLOCKED: {title} (by: {blocked_by})")
                result_content.append({"type": "text", "text": f"Blocker '{title}' recorded for {AGENTS[agent_id]['name']}"})
            else:
                result_content.append({"type": "text", "text": f"Error: Agent {agent_id} not found"})
        
        else:
            mcp_respond(req_id, error={"code": -32601, "message": f"Tool {tool_name} not found"})
            return

        mcp_respond(req_id, result={"content": result_content})

    elif method == "notifications/initialized":
        pass


def run_mcp_loop():
    """Main loop for MCP stdio communication"""
    # Redirect stdout to stderr for everything else (like Flask logs)
    original_stdout = sys.stdout
    sys.stdout = sys.stderr
    
    try:
        while True:
            line = sys.stdin.readline()
            if not line:
                break
            # Use original stdout for MCP responses
            old_stdout = sys.stdout
            sys.stdout = original_stdout
            handle_mcp_request(line)
            sys.stdout = old_stdout
    except Exception as e:
        log_alert("ERROR", f"MCP Loop Error: {str(e)}")


# ===== MAIN =====

if __name__ == '__main__':
    # Create config if doesn't exist
    if not CONFIG_FILE.exists():
        save_config(load_config())

    # Check if we should run in MCP mode (stdio) or standard Flask mode
    # If stdin is not a TTY, we assume we are being run by an MCP client
    if not sys.stdin.isatty():
        # Start Flask in background
        flask_thread = threading.Thread(
            target=app.run,
            kwargs={'host': 'localhost', 'port': 8888, 'debug': False, 'use_reloader': False},
            daemon=True
        )
        flask_thread.start()
        
        # Run MCP loop (blocks)
        run_mcp_loop()
    else:
        # Standard interactive mode
        print("""
    
╔═════════════════════════════════════════════════════╗
║     MCP Server — NRE Multi-Agent Coordination      ║
╚═════════════════════════════════════════════════════╝

📖 Documentation: .agents/MCP_PROTOCOL.md
📋 State File: .agents/MCP_STATE.md
🔔 Alerts Log: .agents/ALERTS.log

🚀 Server running on http://localhost:8888

Available Endpoints:
├─ GET  /health                 — Health check
├─ GET  /api/agents              — List all agents
├─ GET  /api/task-status         — Task status for agent
├─ GET  /api/task-progress       — Overall progress
├─ POST /api/claim-task          — Agent claims task
├─ POST /api/task-done           — Agent completes task
├─ GET  /api/blockers            — Get blockers
├─ POST /api/blockers            — Report blocker
├─ GET  /api/dependencies        — Dependency graph
├─ POST /api/broadcast           — Broadcast message
├─ GET  /api/comms               — Communication history
├─ GET  /api/state               — Full MCP state
└─ GET  /api/state-summary       — Quick summary
        """)
        
        # Start Flask (blocks)
        app.run(
            host='localhost',
            port=8888,
            debug=False,
            use_reloader=False,
        )
