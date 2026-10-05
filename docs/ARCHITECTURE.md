# GhostTrainer Architecture & Cross-Device Flow

GhostTrainer establishes an ambient fitness loop connecting multiple Amazon smart devices into a unified, proactive coaching ecosystem.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant Ring as Ring Doorbell (Sim)
    participant Alexa as Alexa+ MCP Server
    participant FTV as Fire TV Smart Mirror
    participant Bedrock as AWS Bedrock (Claude 3.5 Sonnet)

    Note over Ring,U: Scheduled Workout Alarm
    Ring->>U: Punctual Doorstep Chime & Porch Display
    Ring->>Alexa: Webhook Event: User Doorbell Summon Triggered
    Alexa->>U: Voice: "Hey Alex, your Ghost Coach is here! Ready to train?"
    U->>Alexa: Voice: "Yeah, let's do leg day."
    Alexa->>FTV: Wake Display & Launch Workout Routine via MCP Tool
    FTV->>FTV: Initialize Webcam & MoveNet Pose Estimation
    loop Real-Time Workout Reps
        FTV->>FTV: Track Squat Depth, Knee Alignment & Rep Count
        opt Form Degradation or Rep Milestone
            FTV->>Bedrock: Stream Telemetry (reps, depth %, tempo, fatigue)
            Bedrock-->>FTV: High-energy Coach Cue ("Chest up, push through heels!")
        end
    end
    FTV->>Bedrock: Workout Complete Payload (total reps, form accuracy, duration)
    Bedrock-->>Alexa: Session Recovery Brief & AI Coach Summary
    Alexa->>U: Voice Summary: "Crushed it! 30 squats with 94% depth. Hydrate now!"
```

## Service Architecture

1. **Ring Doorbell Simulator (`apps/ring-simulator`)**
   - Built on FastAPI.
   - Emulates scheduled doorstep rings, motion triggers, and visual coach presence simulation.
   - Dispatches webhook to Alexa+ MCP; Fire TV consumes via /session/status polling.

2. **Alexa+ MCP Server (`apps/alexa-mcp-server`)**
   - Model Context Protocol (MCP) server running over HTTP with JSON-RPC.
   - Tools exposed:
     - `get_workout_schedule`
     - `start_workout_session`
     - `report_workout_metrics`
     - `get_ai_coach_recovery_brief`

3. **Fire TV Smart Mirror (`apps/fire-tv-app`)**
   - 10-foot UI designed with high contrast Tailwind CSS for living room viewing.
   - D-Pad navigable via standard TV remote keys (`ArrowUp`, `ArrowDown`, `Enter`).
   - MoveNet Pose Estimation running in browser via TensorFlow.js for squat depth & rep tracking.

4. **Bedrock Coach Package (`packages/bedrock-coach`)**
   - Python client integrating with AWS Bedrock (`anthropic.claude-3-5-sonnet`).
   - Analyzes biomechanical telemetry, detects fatigue degradation, and generates real-time audio/visual cues.
