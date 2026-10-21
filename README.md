# GhostTrainer: Cross-Device Ambient AI Fitness Coach

[![Amazon Developer Hackathon 2026](https://img.shields.io/badge/Hackathon-Amazon%20Developer%202026-orange.svg)](https://amazonappdev2026.devpost.com/)
[![Fire TV Track](https://img.shields.io/badge/Track-Fire%20TV-blue.svg)](https://amazonappdev2026.devpost.com/)
[![AWS Builder Track](https://img.shields.io/badge/Mini%20Challenge-AWS%20Bedrock-yellow.svg)](https://amazonappdev2026.devpost.com/)
[![Open Source](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![CI](https://github.com/hendri-tobing/GhostTrainer/actions/workflows/ci.yml/badge.svg)](https://github.com/hendri-tobing/GhostTrainer/actions/workflows/ci.yml)

> **GhostTrainer** transforms at-home fitness from a neglected routine into an unskippable real-world ritual across the Amazon ecosystem: Ring Doorbell, Alexa+ MCP, Fire TV Smart Mirror, and AWS Bedrock AI.

---

## 🚀 The Multi-Device Ambient Loop

1. **The Punctual Doorstep Summon (Ring API Simulator):**  
   At your scheduled workout time, your front doorbell chimes. The Ring camera feed activates—a digital "coach" has arrived at your porch to hold you accountable.
2. **The Conversational Bridge (Alexa+ MCP Server):**  
   Alexa greets you from the hallway speaker, confirming your readiness, reading your energy level, and initiating your daily session.
3. **The Ambient Smart Mirror (Fire TV 10-foot UI):**  
   Your living room Fire TV springs to life with computer vision pose estimation (MoveNet/MediaPipe), tracking reps, squat depth, and form accuracy in real-time.
4. **Agentic Feedback Loop (AWS Bedrock):**  
   Claude Sonnet (5.5 / 3.5) processes session telemetry to dynamically adjust your routine and generate a personalized post-workout recovery brief.

---

## 📂 Repository Structure

```
GhostTrainer/
├── LICENSE                     # MIT Open Source License
├── README.md                   # Comprehensive documentation & setup guide
├── AGENTS.md                   # Core instructions & guidelines for AI coding agents
├── docker-compose.yml          # Local multi-service orchestration
├── docs/
│   ├── ARCHITECTURE.md         # Detailed cross-device flow diagrams
│   ├── FRICTION_LOG.md         # Detailed developer feedback & friction log for Amazon ecosystem
│   └── SCRIPT_DEMO.md          # 3-minute video production script
├── apps/
│   ├── ring-simulator/         # Python FastAPI Ring Doorbell event mock & webhook
│   ├── alexa-mcp-server/       # Python FastAPI Streamable HTTP MCP Server
│   └── fire-tv-app/            # React / HTML5 TV web app with real-time pose detection
└── packages/
    └── bedrock-coach/          # AWS SDK Bedrock prompts, fatigue analysis & summary
```

---

## 🛠️ Quickstart & Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+ / npm or yarn
- AWS Account with Bedrock access (Claude Sonnet 5.5 / 3.5 enabled in `us-east-1` or `us-west-2`)

### 1. Configure Environment Variables
Copy and fill out your credentials:
```bash
cp .env.example .env
```
*(Note: If AWS credentials are unset, GhostTrainer automatically falls back to deterministic rule-based coaching algorithms for zero-failure local testing and offline demos!)*

### 2. Launch Demo Stack
Run the entire cross-device stack locally with a single command:
```bash
./scripts/start_demo.sh
```
Or run with Docker Compose:
```bash
docker compose up --build
```

### 3. Service Endpoints
- **Ring Doorbell Simulator:** http://localhost:8001 (Interactive dashboard & webhook triggers)
- **Alexa+ MCP Server:** http://localhost:8002/mcp (Streamable HTTP JSON-RPC 2.0)
- **Fire TV Smart Mirror UI:** http://localhost:3000 (10-foot UI with MoveNet CV & Picture-in-Picture)

### 4. Automated End-to-End Demo Loop
Run the complete cross-device simulation script in one command:
```bash
python3 scripts/demo_flow.py
```

### 5. Running Automated Unit Tests
```bash
pytest packages/bedrock-coach/tests/ apps/ring-simulator/test_ring_simulator.py apps/alexa-mcp-server/test_alexa_mcp.py
```

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
