# GhostTrainer: Cross-Device Ambient AI Fitness Coach

[![Amazon Developer Hackathon 2026](https://img.shields.io/badge/Hackathon-Amazon%20Developer%202026-orange.svg)](https://amazonappdev2026.devpost.com/)
[![Fire TV Track](https://img.shields.io/badge/Track-Fire%20TV%20($25k)-blue.svg)](https://amazonappdev2026.devpost.com/)
[![AWS Builder Track](https://img.shields.io/badge/Mini%20Challenge-AWS%20Bedrock%20($5k)-yellow.svg)](https://amazonappdev2026.devpost.com/)
[![Open Source](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

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
   Claude 3.5 Sonnet processes session telemetry to dynamically adjust your routine and generate a personalized post-workout recovery brief.

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
│   ├── FRICTION_LOG.md         # Official 10% bonus friction log for Amazon judges
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
- AWS Account with Bedrock access (Claude 3.5 Sonnet enabled in `us-east-1` or `us-west-2`)

### 1. Configure Environment Variables
Copy and fill out your AWS credentials in `.env`:
```bash
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

### 3. Service Endpoints
- **Ring Doorbell Simulator:** http://localhost:8001
- **Alexa+ MCP Server:** http://localhost:8002/mcp
- **Fire TV Smart Mirror UI:** http://localhost:3000

---

## 🏆 Hackathon Targets & Prizes
- **Primary Track:** Fire TV ($25,000 Cash)
- **Mini Challenge 1:** AWS Builder via Bedrock ($5,000 Cash + $5k Credits)
- **Mini Challenge 2:** Open Source MIT License ($5,000 Cash + $5k Credits)
- **Total Potential Prize:** $35,000 Cash + $10,000 AWS Credits

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.
