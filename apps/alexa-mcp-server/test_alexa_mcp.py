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


def test_receive_rep_telemetry() -> None:
    payload = {
        "rep_number": 1,
        "depth_percentage": 94.0,
        "duration_seconds": 1.7,
        "detected_issue": None
    }
    response = client.post("/api/telemetry/rep", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "cue_text" in data
    assert data["rep_number"] == 1


def test_finish_workout() -> None:
    payload = {
        "user_name": "Alex",
        "total_duration_seconds": 90.0
    }
    response = client.post("/api/workout/complete", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert "brief" in data
    assert "overall_score" in data["brief"]


def test_overdepth_telemetry_then_complete() -> None:
    # T1: Telemetry with depth > 100 should be clamped and not cause 500 in /api/workout/complete
    rep_res = client.post("/api/telemetry/rep", json={
        "rep_number": 1,
        "depth_percentage": 113.0,
        "duration_seconds": 1.7,
        "detected_issue": None
    })
    assert rep_res.status_code == 200

    finish_res = client.post("/api/workout/complete", json={
        "user_name": "Alex",
        "total_duration_seconds": 60.0
    })
    assert finish_res.status_code == 200
    data = finish_res.json()
    assert data["status"] == "completed"
    assert "brief" in data


def test_start_session_clears_ring_event() -> None:
    # T2: Webhook notifies Ring event, start_workout_session clears it
    client.post("/webhook/ring", json={
        "event_type": "ding",
        "coach_name": "Ghost Coach Jordan",
        "workout_type": "Squat Power Routine"
    })
    status_before = client.get("/session/status").json()
    assert status_before["last_ring_event"] is not None

    mcp_call = client.post("/mcp", json={
        "jsonrpc": "2.0",
        "id": "clear-ring-test",
        "method": "tools/call",
        "params": {
            "name": "start_workout_session",
            "arguments": {"exercise_name": "Squat", "target_reps": 10}
        }
    })
    assert mcp_call.status_code == 200

    status_after = client.get("/session/status").json()
    assert status_after["last_ring_event"] is None


def test_rep_telemetry_detected_issue_roundtrip() -> None:
    # T3: detected_issue survives into session_state and round-trips into WorkoutSessionData
    client.post("/api/telemetry/rep", json={
        "rep_number": 1,
        "depth_percentage": 90.0,
        "duration_seconds": 1.8,
        "detected_issue": "chest_sag"
    })
    finish_res = client.post("/api/workout/complete", json={
        "user_name": "Alex",
        "total_duration_seconds": 60.0
    })
    assert finish_res.status_code == 200


def test_reset_workout_endpoint() -> None:
    # T12: POST /api/workout/reset clears active, reps, completed_reps, and last_ring_event
    client.post("/webhook/ring", json={
        "event_type": "ding",
        "coach_name": "Ghost Coach Jordan",
        "workout_type": "Squat Power Routine"
    })
    client.post("/api/telemetry/rep", json={
        "rep_number": 1,
        "depth_percentage": 90.0,
        "duration_seconds": 1.5,
    })
    res = client.post("/api/workout/reset")
    assert res.status_code == 200
    status = client.get("/session/status").json()
    assert status["active"] is False
    assert status["completed_reps"] == 0
    assert status["last_ring_event"] is None



