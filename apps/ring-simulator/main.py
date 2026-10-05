"""Ring Doorbell Simulator for GhostTrainer.

Simulates doorbell dings, motion detection events, and porch presence notifications,
dispatching webhooks to the Alexa+ MCP Server.
"""

import os
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ring-simulator")

app = FastAPI(
    title="GhostTrainer Ring Doorbell Simulator",
    version="1.0.0",
    description="Simulates Ring video doorbell motion & doorbell dings with coach arrival events.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Webhook targets
ALEXA_MCP_WEBHOOK_URL = os.getenv("ALEXA_MCP_WEBHOOK_URL", "http://localhost:8002/webhook/ring")

# State
event_history: List[Dict[str, Any]] = []


class RingTriggerPayload(BaseModel):
    event_type: str = Field("ding", description="'ding' or 'motion'")
    coach_name: str = Field("Ghost Coach Jordan", description="Name of visiting coach avatar")
    workout_type: str = Field("Squat Power Session", description="Scheduled workout routine")
    message: str = Field("Your coach is on the porch ready to train!", description="Notification preview message")


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok", "service": "ring-simulator", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/events")
async def get_events() -> Dict[str, Any]:
    """Get recent ring doorbell events."""
    return {"total_events": len(event_history), "events": event_history[-20:]}


async def _dispatch_webhook(url: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Helper to dispatch async webhooks gracefully."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(url, json=payload)
            return {"url": url, "status_code": resp.status_code}
    except Exception as exc:
        logger.warning("Could not reach webhook url %s: %s", url, str(exc))
        return {"url": url, "error": str(exc)}


@app.post("/api/trigger/ding")
async def trigger_ding(payload: RingTriggerPayload) -> Dict[str, Any]:
    """Simulate a doorbell chime / coach arrival."""
    event_data = {
        "event_id": f"ring_{uuid4().hex[:16]}",
        "event_type": "ding",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "device_id": "ring_front_door_pro",
        "coach_name": payload.coach_name,
        "workout_type": payload.workout_type,
        "message": payload.message,
        "snapshot_url": "/static/coach_on_porch.png",
    }
    event_history.append(event_data)

    dispatch_res = await _dispatch_webhook(ALEXA_MCP_WEBHOOK_URL, event_data)

    return {
        "status": "success",
        "event": event_data,
        "dispatch_results": [dispatch_res],
    }


@app.post("/api/trigger/motion")
async def trigger_motion() -> Dict[str, Any]:
    """Simulate motion detected on porch."""
    event_data = {
        "event_id": f"motion_{uuid4().hex[:16]}",
        "event_type": "motion",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "device_id": "ring_front_door_pro",
        "coach_name": "Ghost Coach Jordan",
        "workout_type": "Squat Power Session",
        "message": "Movement detected at Front Door. Coach standing by.",
    }
    event_history.append(event_data)
    dispatch_res = await _dispatch_webhook(ALEXA_MCP_WEBHOOK_URL, event_data)
    return {"status": "success", "event": event_data, "dispatch_results": [dispatch_res]}


@app.get("/", response_class=HTMLResponse)
async def dashboard() -> str:
    """Developer console to trigger simulated Ring events."""
    recent_html = "".join(
        f"<li style='margin-bottom: 8px; font-family: monospace;'><strong>{e.get('created_at', '')[:19]}</strong> [{e.get('event_type')}] {e.get('message')}</li>"
        for e in reversed(event_history[-10:])
    ) or "<em>No events triggered yet.</em>"

    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Ring Doorbell Simulator | GhostTrainer</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f3f4f6; padding: 40px; margin: 0; }}
            .container {{ max-width: 800px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
            h1 {{ color: #38bdf8; font-size: 24px; margin-top: 0; }}
            p {{ color: #9ca3af; }}
            .btn {{ background: #2563eb; color: white; border: none; padding: 12px 20px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; transition: 0.2s; margin-right: 12px; }}
            .btn:hover {{ background: #1d4ed8; }}
            .btn-accent {{ background: #f97316; }}
            .btn-accent:hover {{ background: #ea580c; }}
            .panel {{ background: #1e293b; border-radius: 8px; padding: 16px; margin-top: 20px; }}
            ul {{ list-style-type: none; padding-left: 0; }}
            .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; background: #065f46; color: #a7f3d0; margin-bottom: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <span class="badge">Amazon Hackathon 2026 Simulator</span>
            <h1>🔔 GhostTrainer Ring Doorbell Simulator</h1>
            <p>Emulate punctual doorstep summon events. When triggered, Ring notifies the Alexa+ MCP Server.</p>
            <div style="margin: 24px 0;">
                <button class="btn btn-accent" onclick="triggerEvent('ding')">🔔 Ring Doorbell (Coach Arrives)</button>
                <button class="btn" onclick="triggerEvent('motion')">🚶 Trigger Porch Motion</button>
            </div>
            <div class="panel">
                <h3>Live Event Stream</h3>
                <ul id="eventList">{recent_html}</ul>
            </div>
        </div>
        <script>
            async function triggerEvent(type) {{
                const res = await fetch('/api/trigger/' + type, {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{
                        event_type: type,
                        coach_name: "Ghost Coach Jordan",
                        workout_type: "Squat Power Session",
                        message: "Ghost Coach is standing on your porch with training gear!"
                    }})
                }});
                const data = await res.json();
                location.reload();
            }}
        </script>
    </body>
    </html>
    """
