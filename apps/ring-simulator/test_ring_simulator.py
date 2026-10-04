"""Unit tests for Ring Simulator."""

import sys
import os
import importlib.util
from fastapi.testclient import TestClient

file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "main.py")
spec = importlib.util.spec_from_file_location("ring_simulator_main", file_path)
ring_module = importlib.util.module_from_spec(spec)
sys.modules["ring_simulator_main"] = ring_module
spec.loader.exec_module(ring_module)

client = TestClient(ring_module.app)


def test_health_check() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "ring-simulator"


def test_trigger_ding() -> None:
    payload = {
        "event_type": "ding",
        "coach_name": "Ghost Coach Jordan",
        "workout_type": "Squat Session",
        "message": "Coach Jordan has arrived!",
    }
    response = client.post("/api/trigger/ding", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["event"]["event_type"] == "ding"


def test_trigger_motion() -> None:
    response = client.post("/api/trigger/motion")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["event"]["event_type"] == "motion"
