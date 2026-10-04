"""Unit tests for Alexa+ MCP Server."""

import sys
import os
import importlib.util
from fastapi.testclient import TestClient

# Load alexa-mcp-server main module specifically
file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "main.py")
spec = importlib.util.spec_from_file_location("alexa_mcp_main", file_path)
alexa_module = importlib.util.module_from_spec(spec)
sys.modules["alexa_mcp_main"] = alexa_module
spec.loader.exec_module(alexa_module)

client = TestClient(alexa_module.app)


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_tools_list() -> None:
    payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
        "params": {}
    }
    response = client.post("/mcp", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "tools" in data["result"]
    tool_names = [t["name"] for t in data["result"]["tools"]]
    assert "get_workout_schedule" in tool_names
    assert "start_workout_session" in tool_names


def test_start_workout_session() -> None:
    payload = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "start_workout_session",
            "arguments": {
                "exercise_name": "Squat",
                "target_reps": 12
            }
        }
    }
    response = client.post("/mcp", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "content" in data["result"]


def test_webhook_ring() -> None:
    payload = {
        "event_type": "ding",
        "coach_name": "Ghost Coach Jordan",
        "workout_type": "Squat Power Routine"
    }
    response = client.post("/webhook/ring", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "acknowledged"
