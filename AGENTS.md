# AGENTS.md: Developer Guidelines & Best Practices for GhostTrainer

Welcome, AI Agents and developers! This document serves as the absolute source of truth for coding style, architecture patterns, and operational rules when building and maintaining **GhostTrainer**.

---

## 1. Core Principles & Philosophy

- **Zero Fabricated Output:** Never invent or simulate backend results, API responses, or mock telemetry when real execution or tool output is expected. Report blockers honestly.
- **Bite-Sized & Test-Driven:** Every task must be broken down into clean, testable units (2–5 minutes of focused execution). Follow TDD where applicable.
- **Cross-Device Reliability:** GhostTrainer relies on asynchronous events (Ring webhooks → Alexa MCP → Fire TV → AWS Bedrock). Ensure all inter-service communication handles network retries and graceful degradation.

---

## 2. Tech Stack & Standards

### Backend (Ring Simulator & Alexa MCP & Bedrock)
- **Language:** Python 3.11+
- **Framework:** FastAPI
- **Validation:** Pydantic v2
- **Async/Sync:** Use asynchronous endpoints (`async def`) for high-throughput webhook handling and MCP streamable HTTP endpoints.

### Frontend (Fire TV Smart Mirror)
- **Framework:** React / HTML5 (optimized for 10-foot UI / TV screens & browsers)
- **Styling:** Tailwind CSS (high contrast, readable typography from 10 feet away)
- **Computer Vision:** TensorFlow.js / MoveNet / MediaPipe via local webcam feed.

---

## 3. Code Quality & Style Rules

1. **Absolute Paths:** Always use absolute file paths for file system operations.
2. **Type Hinting:** All Python functions and methods must include explicit type annotations.
3. **Docstrings & Comments:** Brief, clear docstrings for public classes and functions.
4. **Error Handling:** Catch specific exceptions rather than bare `except:` clauses. Log errors clearly with context.
5. **Non-Interactive Commands:** CLI tools and package installers must run non-interactively (e.g., `pip install --no-cache-dir`, `npm ci`).

---

## 4. The Friction Log Requirement

Whenever you encounter a developer pain point, SDK quirk, latency bottleneck, or emulator limitation while building, document it immediately in `docs/FRICTION_LOG.md`. This directly supports providing comprehensive feedback for the Amazon developer ecosystem!
