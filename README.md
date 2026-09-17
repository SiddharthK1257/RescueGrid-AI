# 🚨 RESCUEGRID AI

**Tagline:** *One Emergency. Many AI Agents. One Shared Context.*

**Hackathon:** HiDevs Hackathon  
**Challenge Track:** Multiplayer AI and Collaborative Agents  
**Category:** AI-Powered Emergency-Response Coordination and Collaborative Intelligence Platform  

---

## 🧭 Executive Summary

**RESCUEGRID AI** is an emergency-response coordination workspace where human incident commanders and specialized AI agents collaborate on evolving disasters using shared context.

Rather than a simple chatbot, RESCUEGRID AI provides a mission-critical operations grid:
1. Receives complex emergency incident reports.
2. Ingests and maintains continuous shared incident memory through **Moss**.
3. Concurrently delegates domain tasks across **7 specialized AI agents** orchestrated in **Python**.
4. Conducts structured reasoning using **Google Gemini**.
5. Enables real-time voice communications and command discussion rooms via **LiveKit**.
6. Visualizes disaster epicenters, hazard perimeters, and live browser GPS location on an **Interactive Tactical Leaflet Map**.
7. Automatically triggers dynamic replanning when new telemetry is injected (Plan v1 ➔ Plan v2).
8. Enforces a **Human-in-the-Loop** approval and verifiable audit trail.

> [!IMPORTANT]
> **Safety Boundary & Disclaimer:** RESCUEGRID AI is an AI-assisted coordination prototype for demonstration and training. AI-generated recommendations are advisory and require human review. It does NOT replace authorized 911 dispatch, trained first responders, or licensed medical doctors.

---

## 🛠️ Mandatory Technology Stack

| Mandatory Technology | Architecture Role | Verification & Integration Details |
| :--- | :--- | :--- |
| **Moss** | Shared Context & Multi-Agent Memory | Ingests dispatch reports, agent findings, operator notes, and versioned plans. Provides semantic retrieval across agent memories with automatic local demo context fallback. |
| **LiveKit** | Real-Time Voice Collaboration | Server-side temporary JWT room token generation (`livekit-api` SDK), animated audio waveforms, microphone toggles, participant roster, and text chat fallback. |
| **Next.js 16** | Command-Centre Frontend | Built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS. Dark tactical command-centre theme with 14 modular views. |
| **Python 3.11+** | AI Processing & Orchestration | High-performance asynchronous agent engine (`asyncio.gather`), typed Pydantic models, and conflict resolution algorithms. |
| **FastAPI** | Backend REST & Telemetry API | Robust REST API endpoints for incident lifecycles, dynamic reassessment, map data, LiveKit tokens, and audit logging. |
| **Gemini API** | Structured Reasoning Engine | Generates structured JSON assessments, START triage classifications, hazard cordons, and versioned response plans. |
| **MongoDB** | Persistent Application Datastore | Asynchronous Motor driver persistence with seamless in-memory fallback store ensuring zero demo crashes. |
| **Interactive Map** | Location Visualization & Live GPS | Leaflet interactive map with browser Geolocation API (`"Use My Live Location"` with explicit permission gates), tactical markers, and simulated GPS mode. |

---

## 🏗️ System Architecture

```text
                             HUMAN OPERATOR
                                   │
                                   ▼
                       NEXT.JS 16 COMMAND CENTRE
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
      INCIDENT WORKSPACE        LIVEKIT             TACTICAL MAP
      • Plan Approval/Reject   • WebRTC Voice Room  • Leaflet OSM
      • Injected Updates       • Audio Visualizer   • Browser Live GPS
      • Audit Timeline         • Text Fallback      • Tactical Markers
             │                     │                     │
             └─────────────────────┼─────────────────────┘
                                   ▼
                       FASTAPI PYTHON BACKEND
                                   │
                                   ▼
                      PYTHON AGENT ORCHESTRATOR
                                   │
                                   ▼
                         COMMANDER AGENT
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
  SPECIALIZED AGENTS         MOSS SHARED CONTEXT      PERSISTENT STATE
  • Medical Triage           • Semantic Retrieval     • MongoDB (Motor)
  • Heavy Rescue             • Cross-Agent Memory     • Resilient In-Memory
  • Traffic & Routes         • Plan Snapshots         • Audit Trail
  • Asset Resources          • Local Demo Fallback
  • Public Safety PIO
  • Situation Monitor
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   ▼
                           GEMINI AI REASONING
                                   │
                                   ▼
                         VERSIONED RESPONSE PLAN
                                   │
                                   ▼
                         HUMAN-IN-THE-LOOP APPROVAL
```

---

## 🤖 Specialized AI Agent Hierarchy

1. **Commander Agent**
   - Central coordinator.
   - Evaluates multi-agent assessments, resolves tactical trade-offs, and synthesizes versioned Response Plans (v1, v2...).
   - Explicitly explains why plans changed following injected field updates.
2. **Medical Agent**
   - START triage categorization (Immediate/Delayed/Minor) and casualty flow estimates without diagnosing patients.
3. **Rescue Agent**
   - Assesses vehicle cabin deformation, extrication cutter requirements, and establishes hot/warm/cold safety cordons.
4. **Traffic & Route Agent**
   - Analyzes highway bottlenecks, establishes emergency ingress corridors (e.g. Exit 42B bypass), and alerts upstream message signs.
5. **Resource Agent**
   - Quantifies required mutual aid apparatus (ALS ambulances, heavy rescue tenders, foam pumpers) and organizes Staging Area Alpha.
6. **Communication Agent**
   - Generates NIMS/ICS compliant Situation Reports (SITREP) and drafts public safety evacuation advisories.
7. **Situation Monitor Agent**
   - Continuously tracks environmental drift, smoke dispersion, and compound hazard triggers.

---

## 🎬 Flagship Hackathon Demo Walkthrough

### Scenario: Interstate 95 Multi-Vehicle Pileup (`RG-2026-0001`)

**Initial 911 Report:**
> *"Three vehicles have collided on a highway. Six people are reportedly involved. Two people may have serious injuries. One vehicle is smoking, and the highway is partially blocked."*

### Demo Execution Steps:

```text
Step 1: Open RESCUEGRID AI Command Centre
        ↓
Step 2: Initialize Flagship Scenario (RG-2026-0001)
        ↓
Step 3: Moss Context Initialized with Initial 911 Report
        ↓
Step 4: Specialized Agents Concurrently Assess & Commander Synthesizes Plan v1
        (Immediate hydraulic extrication, ALS triage station, Exit 41 traffic divert)
        ↓
Step 5: Operator Selects "Use My Live Location" (Demonstrates Browser GPS Permission)
        ↓
Step 6: Operator Opens LiveKit Voice Room & Discusses Tactical Picture
        ↓
Step 7: Operator Injects Critical Escalation:
        "Fire is now reported in one vehicle, and the primary access lane is blocked."
        ↓
Step 8: Moss Shared Context Updated in Real-Time
        ↓
Step 9: Traffic, Rescue, Medical, and Monitor Agents Reassess in Parallel
        ↓
Step 10: Commander Formulates Revised Plan v2:
         • Action 1 (TRAFFIC): Reroute ambulances via North Service Road (Exit 42B)
         • Action 2 (RESCUE): Charge Class B foam suppression attack line
         • Action 3 (MEDICAL): Relocate triage station to 150m upwind buffer zone
        ↓
Step 11: Human Operator Reviews and Clicks "Approve Plan"
        ↓
Step 12: Action Recorded in Immutable Audit Timeline Log
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher (or `uv`)

### 1. Installation

Clone and install backend & frontend dependencies:

```bash
# Clone the repository
git clone https://github.com/SiddharthK1257/RescueGrid-AI.git
cd RescueGrid-AI

# Install frontend dependencies
cd next_app
npm install
cd ..

# Create Python virtual environment and install packages
python -m venv backend_venv
backend_venv\Scripts\pip install -r backend/requirements.txt
```

*(If using `uv`, you can run `uv pip install -p backend_venv\Scripts\python.exe -r backend/requirements.txt`)*

### 2. Environment Configuration

Verify or edit your `.env` file in the project root:

```env
PORT=8000
HOST=0.0.0.0
MONGODB_URI=mongodb+srv://admin:your_password@cluster0.mongodb.net/?appName=Cluster0
GEMINI_API_KEY=your_gemini_api_key_here
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secretkey1234567890abcdefghijklmnopqrstuvwxyz
LIVEKIT_URL=wss://rescuegrid.livekit.cloud
MOSS_API_KEY=
MOSS_ENDPOINT=http://localhost:8000/api/moss/local
```

### 3. Launching the Application

Run both the **FastAPI Backend** (port 8000) and **Next.js Frontend** (port 3000) concurrently with a single command:

```bash
npm run dev
```

Or on Windows, double-click:
```bash
start.bat
```

Open your browser at:
**http://localhost:3000**

---

## 🧪 Testing Suite

Run the full automated integration test suite:

```bash
# Run backend pytest suite
npm run backend:test
```

Or directly via pytest:
```bash
backend_venv\Scripts\python.exe -m pytest backend/tests/test_api.py -v
```

### Test Coverage Highlights:
- ✅ Health endpoint & service availability reporting
- ✅ Incident creation & coordinate validation
- ✅ Moss shared context ingestion and retrieval
- ✅ Multi-agent concurrent pipeline execution
- ✅ LiveKit server token generation
- ✅ Human approval & plan status state transitions
- ✅ Simulation update injection & Plan v2 dynamic replanning

---

## 🛡️ Security & Privacy Compliance

- **No Secrets in Client Code**: All Gemini API keys, LiveKit API secrets, and database credentials remain strictly server-side.
- **Browser Geolocation Privacy**: Exact coordinates are never collected without explicit browser permission. Users can stop tracking at any time, or switch to simulated GPS mode.
- **Explainable AI**: Every plan modification contains reasoning and highlights unresolved uncertainty.

---

## 📄 License
MIT License. Built for the **HiDevs Hackathon — Multiplayer AI and Collaborative Agents**.
