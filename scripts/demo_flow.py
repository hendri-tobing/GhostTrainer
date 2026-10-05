#!/usr/bin/env python3
"""End-to-end integration and demonstration runner for GhostTrainer.

Executes the complete cross-device loop:
1. Ring Doorbell Summon -> Webhook Dispatch
2. Alexa+ MCP Session Start
3. Fire TV MoveNet Rep Telemetry Streaming -> Bedrock AI Cues
4. Session Completion -> AWS Bedrock Recovery Brief
"""

import sys
import time
import httpx

RING_URL = "http://localhost:8001"
ALEXA_URL = "http://localhost:8002"


def run_e2e_demo() -> None:
    print("=" * 70)
    print("🚀 GHOSTTRAINER CROSS-DEVICE AMBIENT AI INTEGRATION DEMO")
    print("=" * 70)

    with httpx.Client(timeout=10.0) as client:
        # 1. Health Checks
        print("\n[Phase 0] Verifying Service Health...")
        try:
            r_ring = client.get(f"{RING_URL}/health")
            print(f"  ✓ Ring Simulator: {r_ring.json()['service']} ({r_ring.status_code})")
        except Exception as e:
            print(f"  ✗ Ring Simulator unreachable at {RING_URL}: {e}")
            sys.exit(1)

        try:
            r_alexa = client.get(f"{ALEXA_URL}/health")
            print(f"  ✓ Alexa+ MCP Server: {r_alexa.json()['service']} ({r_alexa.status_code})")
        except Exception as e:
            print(f"  ✗ Alexa MCP unreachable at {ALEXA_URL}: {e}")
            sys.exit(1)

        # 2. Ring Doorstep Summon
        print("\n[Phase 1] Punctual Doorstep Summon (Ring Doorbell)...")
        ring_payload = {
            "event_type": "ding",
            "coach_name": "Ghost Coach Jordan",
            "workout_type": "Squat Power Routine",
            "message": "Ghost Coach is standing on your porch with workout gear!"
        }
        res = client.post(f"{RING_URL}/api/trigger/ding", json=ring_payload)
        print(f"  ✓ Ring Bell Chimed! Event ID: {res.json()['event']['event_id']}")
        print(f"  ✓ Message: \"{res.json()['event']['message']}\"")
        time.sleep(1)

        # 3. Alexa+ MCP Session Start
        print("\n[Phase 2] Alexa+ Voice Conversation & MCP Tool Trigger...")
        mcp_start = {
            "jsonrpc": "2.0",
            "id": "alexa_001",
            "method": "tools/call",
            "params": {
                "name": "start_workout_session",
                "arguments": {
                    "exercise_name": "Squat",
                    "target_reps": 5
                }
            }
        }
        res = client.post(f"{ALEXA_URL}/mcp", json=mcp_start)
        print(f"  ✓ Alexa MCP Tool Executed: {res.json()['result']['content'][0]['text']}")
        time.sleep(1)

        # 4. Fire TV Pose Detection Rep Streaming & Real-Time Bedrock Cues
        print("\n[Phase 3] Fire TV Smart Mirror Rep Tracking & Bedrock Feedback...")
        mock_reps = [
            {"rep_number": 1, "depth_percentage": 92.0, "detected_issue": None, "desc": "Solid clean rep"},
            {"rep_number": 2, "depth_percentage": 94.5, "detected_issue": None, "desc": "Full parallel depth"},
            {"rep_number": 3, "depth_percentage": 78.0, "detected_issue": "chest_sag", "desc": "Torso forward lean flaw"},
            {"rep_number": 4, "depth_percentage": 91.0, "detected_issue": None, "desc": "Form corrected"},
            {"rep_number": 5, "depth_percentage": 96.0, "detected_issue": None, "desc": "Final rep locked in"},
        ]

        for r in mock_reps:
            payload = {
                "rep_number": r["rep_number"],
                "depth_percentage": r["depth_percentage"],
                "duration_seconds": 1.7,
                "detected_issue": r["detected_issue"],
            }
            res = client.post(f"{ALEXA_URL}/api/telemetry/rep", json=payload)
            data = res.json()
            cue = data["cue_text"]
            urgency = data["urgency"]
            tag = "[CORRECTION]" if urgency == "corrective" else "[COACH CUE]"
            print(f"  -> Rep {r['rep_number']}/5 ({r['depth_percentage']}% depth): {tag} \"{cue}\"")
            time.sleep(0.8)

        # 5. Conclude Workout & AWS Bedrock Recovery Brief
        print("\n[Phase 4] Session Complete & AWS Bedrock AI Recovery Debrief...")
        res = client.post(f"{ALEXA_URL}/api/workout/complete", json={"user_name": "Alex", "total_duration_seconds": 45.0})
        brief = res.json()["brief"]

        print(f"  ✓ Overall AI Form Score: {brief['overall_score']}/100")
        print(f"  ✓ Summary: {brief['summary']}")
        print("  ✓ Strengths:")
        for s in brief.get("strengths", []):
            print(f"     • {s}")
        print("  ✓ Recovery Action Items:")
        for rec in brief.get("recovery_recommendations", []):
            print(f"     • {rec}")

        print("\n" + "=" * 70)
        print("🎉 COMPLETE AMBIENT LOOP EXECUTED SUCCESSFULLY!")
        print("=" * 70)


if __name__ == "__main__":
    run_e2e_demo()
