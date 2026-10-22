#!/usr/bin/env bash
# ==============================================================================
# GhostTrainer 1-Click Interactive Demo Stack Launcher
# Starts Ring Simulator (:8001), Alexa MCP Server (:8002), and Fire TV App (:3000)
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

VENV_PYTHON="${ROOT_DIR}/.venv/bin/python"
if [ ! -f "${VENV_PYTHON}" ]; then
    VENV_PYTHON="python3"
fi

# Load .env if present
if [ -f "${ROOT_DIR}/.env" ]; then
    echo "📄 Loading environment variables from ${ROOT_DIR}/.env..."
    set -a
    source "${ROOT_DIR}/.env"
    set +a
fi

echo "======================================================================"
echo "👻 GHOSTTRAINER DEMO STACK LAUNCHER"
echo "======================================================================"

cleanup() {
    echo ""
    echo "🛑 Shutting down GhostTrainer demo stack..."
    kill $(jobs -p) 2>/dev/null || true
    echo "✓ All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start Ring Simulator
echo "▶ Starting Ring Doorbell Simulator on http://localhost:8001..."
PYTHONPATH="${ROOT_DIR}" "${VENV_PYTHON}" -m uvicorn main:app --app-dir "${ROOT_DIR}/apps/ring-simulator" --port 8001 > /dev/null 2>&1 &
PID_RING=$!

# 2. Start Alexa+ MCP Server
echo "▶ Starting Alexa+ MCP Server on http://localhost:8002..."
PYTHONPATH="${ROOT_DIR}" "${VENV_PYTHON}" -m uvicorn main:app --app-dir "${ROOT_DIR}/apps/alexa-mcp-server" --port 8002 > /dev/null 2>&1 &
PID_ALEXA=$!

# 3. Start Fire TV React App
echo "▶ Starting Fire TV Smart Mirror on http://localhost:3000..."
(cd "${ROOT_DIR}/apps/fire-tv-app" && npm run dev -- --host 0.0.0.0 --port 3000) > /dev/null 2>&1 &
PID_FIRETV=$!

# 4. Wait for services to be ready
echo "⏳ Waiting for services to come online..."
ready=false
for i in {1..20}; do
    if curl -s -f http://localhost:8001/health >/dev/null 2>&1 && \
       curl -s -f http://localhost:8002/health >/dev/null 2>&1 && \
       curl -s -f http://localhost:3000 >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 0.5
done

if [ "$ready" = true ]; then
    echo "======================================================================"
    echo "✨ ALL SERVICES LIVE & READY FOR VIDEO RECORDING!"
    echo "======================================================================"
    echo "📺 Fire TV Smart Mirror:   http://localhost:3000"
    echo "🔔 Ring Doorbell Simulator: http://localhost:8001"
    echo "🧠 Alexa+ MCP API & Spec:  http://localhost:8002/docs"
    echo "======================================================================"
    echo ""
    echo "🎥 RECORDING DEMO WALKTHROUGH (Matches docs/SCRIPT_DEMO.md):"
    echo "  1. [0:00 - 0:30] Introduction: Open http://localhost:3000 in browser (F11 for 10-foot full screen)."
    echo "  2. [0:30 - 1:15] Act I - Ring Summon:"
    echo "     - In another tab, open http://localhost:8001 and click 'Ring Doorbell (Coach Arrives)'."
    echo "     - Switch to Fire TV tab: observe the Ring PiP overlay pop up with chime audio & coach brief!"
    echo "     - Click 'Accept Workout' (or press Enter)."
    echo "  3. [1:15 - 2:15] Act II - Synthetic / Live MoveNet Workout:"
    echo "     - In top HUD, select 'Synthetic Demo' (or use Camera)."
    echo "     - Click 'Start Session'. Watch 30fps MoveNet skeleton track squats with cadence."
    echo "     - On Rep 3, notice chest lean flaw trigger the live AWS Bedrock voice correction cue!"
    echo "  4. [2:15 - 2:45] Act III - Bedrock Recovery Debrief:"
    echo "     - On completing rep 5, Bedrock AI generates overall form score (90/100) & hydration plan."
    echo "  5. [2:45 - 3:00] Act IV - Architecture & Friction Log:"
    echo "     - Showcase docs/ARCHITECTURE.md and docs/FRICTION_LOG.md for the 10% Developer Bonus!"
    echo "======================================================================"
    echo "Press [Ctrl+C] to terminate all demo services."
else
    echo "⚠️ Warning: Some services took longer than expected to start. Check ports 8001, 8002, 3000."
fi

wait
