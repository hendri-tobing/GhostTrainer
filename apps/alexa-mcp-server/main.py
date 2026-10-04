"""GhostTrainer Alexa+ Model Context Protocol (MCP) Server.

Provides tools for Alexa+ voice reasoning to orchestrate workouts,
interface with Fire TV, and leverage AWS Bedrock for biomechanical feedback.
"""

import sys
import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure bedrock-coach package is importable
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGES_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "..", "packages", "bedrock-coach"))
if PACKAGES_DIR not in sys.path:
    sys.path.insert(0, PACKAGES_DIR)

from bedrock_coach import (
    BedrockCoachClient,
    WorkoutSessionData,
    RepMetric,
    RealtimeCueRequest,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("alexa-mcp-server")

app = FastAPI(
    title="GhostTrainer Alexa+ MCP Server",
    version="1.0.0",
    description="Streamable HTTP MCP Server enabling Alexa+ to trigger and coach fitness routines.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bedrock_client = BedrockCoachClient()

# Active state
session_state: Dict[str, Any] = {
    "active": False,
    "current_exercise": "Squat",
    "target_reps": 15,
    "completed_reps": 0,
    "reps": [],
    "last_ring_event": None,
}

MCP_TOOLS = [
    {
        "name": "get_workout_schedule",
        "description": "Fetch the user's scheduled daily workout plan and readiness status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_name": {"type": "string", "description": "Name of user (default Alex)"}
            },
        },
    },
    {
        "name": "start_workout_session",
        "description": "Wake up the Fire TV Smart Mirror and start the pose estimation workout.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "exercise_name": {"type": "string", "description": "Exercise name, e.g., Squat"},
                "target_reps": {"type": "integer", "description": "Target repetition count"},
            },
            "required": ["exercise_name", "target_reps"],
        },
    },
    {
        "name": "get_realtime_coaching_cue",
        "description": "Call AWS Bedrock Claude 3.5 Sonnet to generate an audio cue for the user's current rep.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "current_rep": {"type": "integer"},
                "depth_percentage": {"type": "number"},
                "detected_issue": {"type": "string"},
            },
            "required": ["current_rep", "depth_percentage"],
        },
    },
    {
        "name": "generate_recovery_brief",
        "description": "Conclude session and generate an AWS Bedrock recovery brief with metrics.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "user_name": {"type": "string"}
            },
        },
    },
]


@app.get("/health")
async def health_check() -> Dict[str, Any]:
    return {"status": "ok", "service": "alexa-mcp-server", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/session/status")
async def get_session_status() -> Dict[str, Any]:
    """Retrieve the current workout session status for Fire TV & Alexa."""
    return session_state


@app.post("/webhook/ring")
async def receive_ring_webhook(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Receives doorbell ding or motion event from Ring simulator."""
    logger.info("Received Ring event: %s", payload.get("event_type"))
    session_state["last_ring_event"] = payload
    return {
        "status": "acknowledged",
        "action": "alexa_prompt_queued",
        "alexa_voice_line": f"Hey Alex, {payload.get('coach_name', 'your coach')} is at your front door for {payload.get('workout_type', 'workout')}. Should I launch Fire TV?",
    }


@app.post("/mcp")
async def handle_mcp(request: Request) -> JSONResponse:
    """MCP JSON-RPC 2.0 endpoint for Alexa+ agent integration."""
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"jsonrpc": "2.0", "error": {"code": -32700, "message": "Parse error"}, "id": None})

    method = body.get("method")
    msg_id = body.get("id")
    params = body.get("params", {})

    if method == "tools/list":
        return JSONResponse(content={
            "jsonrpc": "2.0",
            "id": msg_id,
            "result": {"tools": MCP_TOOLS}
        })

    elif method == "tools/call":
        tool_name = params.get("name")
        args = params.get("arguments", {})

        if tool_name == "get_workout_schedule":
            res = {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "scheduled_time": "17:00",
                "routine": "Lower Body Hypertrophy (Squats)",
                "target_reps": 15,
                "coach": "Ghost Coach Jordan",
                "porch_arrived": session_state["last_ring_event"] is not None,
            }
            return JSONResponse(content={"jsonrpc": "2.0", "id": msg_id, "result": {"content": [{"type": "text", "text": str(res)}]}})

        elif tool_name == "start_workout_session":
            session_state["active"] = True
            session_state["current_exercise"] = args.get("exercise_name", "Squat")
            session_state["target_reps"] = args.get("target_reps", 15)
            session_state["completed_reps"] = 0
            session_state["reps"] = []
            return JSONResponse(content={
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"content": [{"type": "text", "text": f"Started {session_state['current_exercise']} session with {session_state['target_reps']} target reps on Fire TV."}]}
            })

        elif tool_name == "get_realtime_coaching_cue":
            req = RealtimeCueRequest(
                current_rep=args.get("current_rep", 1),
                target_reps=session_state["target_reps"],
                latest_depth_percentage=args.get("depth_percentage", 90.0),
                detected_issue=args.get("detected_issue"),
            )
            cue_res = await bedrock_client.generate_realtime_cue(req)
            return JSONResponse(content={
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"content": [{"type": "text", "text": cue_res.cue_text, "urgency": cue_res.urgency}]}
            })

        elif tool_name == "generate_recovery_brief":
            session_data = WorkoutSessionData(
                user_name=args.get("user_name", "Alex"),
                exercise_name=session_state["current_exercise"],
                target_reps=session_state["target_reps"],
                completed_reps=session_state["completed_reps"] or session_state["target_reps"],
                reps=[RepMetric(**r) for r in session_state["reps"]] if session_state["reps"] else [
                    RepMetric(rep_number=i, depth_percentage=92.0, duration_seconds=1.8)
                    for i in range(1, session_state["target_reps"] + 1)
                ],
                total_duration_seconds=120.0,
            )
            brief = await bedrock_client.generate_recovery_brief(session_data)
            session_state["active"] = False
            return JSONResponse(content={
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"content": [{"type": "text", "text": brief.model_dump_json()}]}
            })

        else:
            return JSONResponse(content={
                "jsonrpc": "2.0",
                "id": msg_id,
                "error": {"code": -32601, "message": f"Method not found: {tool_name}"}
            })

    return JSONResponse(content={
        "jsonrpc": "2.0",
        "id": msg_id,
        "error": {"code": -32600, "message": f"Unsupported method: {method}"}
    })


class RepTelemetryPayload(BaseModel):
    rep_number: int
    depth_percentage: float
    duration_seconds: float = 1.8
    detected_issue: Optional[str] = None


@app.post("/api/telemetry/rep")
async def receive_rep_telemetry(payload: RepTelemetryPayload) -> Dict[str, Any]:
    """Ingest rep telemetry from Fire TV Smart Mirror and return AWS Bedrock coaching cue."""
    session_state["completed_reps"] = payload.rep_number
    session_state["reps"].append(payload.model_dump())

    req = RealtimeCueRequest(
        current_rep=payload.rep_number,
        target_reps=session_state.get("target_reps", 15),
        latest_depth_percentage=payload.depth_percentage,
        detected_issue=payload.detected_issue,
    )
    cue_res = await bedrock_client.generate_realtime_cue(req)

    return {
        "status": "success",
        "rep_number": payload.rep_number,
        "cue_text": cue_res.cue_text,
        "urgency": cue_res.urgency,
    }


class WorkoutCompletePayload(BaseModel):
    user_name: str = "Alex"
    total_duration_seconds: float = 120.0


@app.post("/api/workout/complete")
async def finish_workout(payload: WorkoutCompletePayload) -> Dict[str, Any]:
    """Conclude workout and return comprehensive Bedrock recovery summary."""
    reps_data = [RepMetric(**r) for r in session_state["reps"]] if session_state["reps"] else [
        RepMetric(rep_number=i, depth_percentage=92.0, duration_seconds=1.8)
        for i in range(1, session_state.get("target_reps", 15) + 1)
    ]
    session_data = WorkoutSessionData(
        user_name=payload.user_name,
        exercise_name=session_state.get("current_exercise", "Squat"),
        target_reps=session_state.get("target_reps", 15),
        completed_reps=session_state.get("completed_reps", len(reps_data)),
        reps=reps_data,
        total_duration_seconds=payload.total_duration_seconds,
    )
    brief = await bedrock_client.generate_recovery_brief(session_data)
    session_state["active"] = False

    return {
        "status": "completed",
        "brief": brief.model_dump(),
    }

