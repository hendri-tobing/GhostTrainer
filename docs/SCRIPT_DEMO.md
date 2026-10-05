# GhostTrainer Demo Video Script (3-Minute Presentation)

**Track:** Fire TV Track ($25,000) & AWS Bedrock ($5,000)  
**Theme:** Turning ambient smart home devices into an unskippable personal fitness coach.

---

### [0:00 - 0:30] Hook & Problem
- **Visual:** User sitting on couch scrolling phone. Clock hits 5:00 PM (scheduled workout time).
- **Narration:** *"Over 70% of home workout routines fail within 3 weeks not because the exercises are too hard, but because there's zero real-world accountability. What if your smart home didn't wait for you to open an app—what if it came to your door?"*

---

### [0:30 - 1:15] Act I: The Ring Summon & Alexa Bridge
- **Visual:** 
  1. Front Door Ring Chime rings. Ring video feed shows the "Ghost Coach" avatar standing on the porch holding workout gear.
  2. Hallway Alexa speaker lights up cyan.
- **Alexa Voice:** *"Hey Alex, it's 5 PM. Your Ghost Coach is at your door ready for Leg Day. Should I fire up the living room screen?"*
- **User:** *"Yes, Alexa. Let's do it."*
- **Visual:** Alexa triggers the MCP tool `start_workout_session`.

---

### [1:15 - 2:15] Act II: Fire TV 10-Foot Smart Mirror & Computer Vision
- **Visual:** 
  1. Fire TV turns on, showing the high-contrast 10-foot UI with live webcam feed and real-time skeleton overlay (MoveNet).
  2. Large, legible HUD showing: **Squats: 0/15**, **Form Depth: 92%**, **Current Cadence: 1.8s/rep**.
  3. User begins squatting. The UI tracks hip/knee angles in real-time, green checkmarks on full depth, audio cue on rep completion.
  4. On Rep 10, user sags their chest. 
  5. Fire TV audio pops up with AWS Bedrock voice cue: *"Keep your chest elevated, Alex! 5 more to hit today's target!"*

---

### [2:15 - 2:45] Act III: Bedrock Telemetry Analysis & Recovery
- **Visual:** 
  1. Session completes. The screen transitions into an analytical dashboard showing rep velocity curves, depth consistency, and Bedrock AI coaching summary.
  2. Alexa delivers the final debrief: *"Session complete! 3 sets of 15 squats, 93% average depth. High fatigue detected on rep 12—make sure to hydrate and stretch your quads!"*

---

### [2:45 - 3:00] Conclusion & Amazon Architecture
- **Visual:** Quick breakdown of the 4 key components:
  - Ring Doorbell Webhook simulator
  - Alexa+ MCP Server over Streamable HTTP
  - Fire TV React 10-Foot UI + MoveNet
  - AWS Bedrock Claude 3.5 Sonnet Engine
- **Narration:** *"GhostTrainer: Ambient intelligence making fitness proactive, frictionless, and unskippable."*
