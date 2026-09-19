# Product Requirements Document (PRD): RESCUEGRID AI

**Version:** 1.0  
**Status:** Implementation-Ready / Hackathon Submission  
**Project Name:** RESCUEGRID AI  
**Tagline:** “One Emergency. Many AI Agents. One Shared Context.”  
**Hackathon:** HiDevs Hackathon  
**Theme:** Multiplayer AI and Collaborative Agents  

---

## 1. Executive Summary
RESCUEGRID AI is a collaborative multi-agent emergency-response coordination platform designed to unify human operators and specialized AI agents within a single, shared-context workspace. Unlike traditional chatbots, RESCUEGRID AI acts as a "Command Centre" for long-running emergency incidents. It leverages **Moss** for high-speed semantic retrieval and shared memory, **Gemini** for structured reasoning, and **LiveKit** for real-time voice collaboration. The system synthesizes complex incident data into actionable response plans, which are continuously re-evaluated as new information arrives, ensuring that human operators always have the most accurate, evidence-backed recommendations.

---

## 2. Problem Statement
Emergency response coordination is often hindered by:
*   **Information Fragmentation:** Data arrives via disparate channels (voice, text, sensors) and is rarely unified.
*   **Context Decay:** In long-running incidents, previous decisions and evolving conditions are easily lost or misunderstood.
*   **Cognitive Overload:** Human operators must simultaneously assess medical, rescue, traffic, and resource needs.
*   **Static Planning:** Traditional response plans do not adapt dynamically to real-time updates (e.g., a new fire report or road blockage).
*   **Lack of Traceability:** AI-generated suggestions often lack the "why" behind a decision, making them difficult for professionals to trust.

---

## 3. Goals & Objectives
*   **Multi-Agent Collaboration:** Demonstrate a "Commander Agent" coordinating six specialized agents working in parallel.
*   **Shared Context (Moss):** Use Moss as the central nervous system for multi-agent state and semantic history.
*   **Human-in-the-Loop:** Ensure all critical AI recommendations require human approval/override.
*   **Real-Time Awareness:** Integrate tactical mapping and LiveKit voice rooms for immediate operator collaboration.
*   **Dynamic Re-evaluation:** Automatically trigger agent reassessment when new incident updates are injected.
*   **Explainability:** Provide a clear timeline of agent actions, evidence sources, and plan versions.

---

## 4. Target Users / Stakeholders
*   **Emergency Operations Coordinator:** The primary user who manages the incident, reviews AI plans, and authorizes actions.
*   **Collaborating Operator:** Secondary users who join the workspace to provide specialized input or monitor specific sectors.
*   **Incident Reporter:** Simulated or real entities providing raw data (text/voice) to the system.
*   **Hackathon Judges:** Technical evaluators looking for sophisticated use of Moss, multi-agent orchestration, and real-time infrastructure.

---

## 5. Functional Requirements

### 5.1 Incident Management
*   **FR-101:** Create and persist incidents with metadata (type, severity, location, affected people).
*   **FR-102:** Support manual location entry and browser-based geolocation (with explicit permission).
*   **FR-103:** Maintain a real-time incident timeline recording all updates, agent findings, and human actions.

### 5.2 Multi-Agent Orchestration
*   **FR-201 (Commander Agent):** Central coordinator that breaks incidents into tasks, delegates to specialized agents, and synthesizes results.
*   **FR-202 (Specialized Agents):** Six distinct agents (Medical, Rescue, Traffic, Resource, Communication, Situation Monitor) with specific reasoning scopes.
*   **FR-203 (Parallel Execution):** Specialized agents must execute concurrently to minimize latency.
*   **FR-204 (Synthesis):** Commander must detect conflicts between agent outputs and highlight uncertainty.

### 5.3 Shared Context & Memory (Moss)
*   **FR-301:** Initialize a unique Moss context for every incident.
*   **FR-302:** Store all incident updates and agent results in Moss for semantic retrieval.
*   **FR-303:** Enable agents to query Moss for relevant historical context before performing reasoning.

### 5.4 Real-Time Collaboration & Mapping
*   **FR-401 (LiveKit):** Establish incident-specific voice rooms for operators.
*   **FR-402 (Tactical Map):** Display incident markers, hazard zones, and responder locations using Leaflet/Mapbox.
*   **FR-403 (Live Updates):** Use WebSockets to push agent activity and plan changes to the UI without refreshing.

### 5.5 Dynamic Re-evaluation
*   **FR-501:** Detect new information (e.g., "Fire spreading to Sector B") and trigger the Situation Monitor.
*   **FR-502:** Automatically re-run relevant agents and generate a "Revised Response Plan" version.

---

## 6. Non-Functional Requirements
*   **Performance:** Agent synthesis should complete within <10 seconds for standard incidents.
*   **Reliability:** System must degrade gracefully; if Moss or LiveKit is unavailable, the core incident dashboard must remain functional.
*   **Security:** No API keys in the frontend; all LLM and Moss calls must be proxied through the FastAPI backend.
*   **Safety:** Explicitly label all AI-generated content. No autonomous dispatching; human approval is a hard gate.
*   **Usability:** Dark-themed "Command Centre" UI optimized for high-stress environments.

---

## 7. System Architecture Overview
The system follows a layered architecture:
1.  **User Layer:** Human operators using the Next.js dashboard.
2.  **Application Layer:** Next.js frontend handling state and real-time visualization.
3.  **API Layer:** FastAPI (Python) managing business logic, auth, and service orchestration.
4.  **Orchestration Layer:** LangGraph-powered Commander Agent managing the agent lifecycle.
5.  **Agent Layer:** Specialized LangChain agents using Gemini for reasoning.
6.  **Context Layer:** Moss providing shared memory and semantic search.
7.  **Data Layer:** MongoDB for persistent records and audit logs.

---

## 8. Tech Stack
*   **Frontend:** Next.js, TypeScript, Tailwind CSS, Leaflet/Mapbox GL JS.
*   **Backend:** FastAPI, Python 3.11, Pydantic.
*   **AI/LLM:** Google Gemini 1.5 Pro (Commander), Gemini 1.5 Flash (Specialized Agents), LangGraph, LangChain.
*   **Shared Context:** Moss SDK (Vector Memory & Semantic Retrieval).
*   **Real-Time:** LiveKit (Voice/WebRTC), Socket.io (Events).
*   **Database:** MongoDB Atlas.
*   **Infrastructure:** Docker, Vercel (Frontend), Railway/Render (Backend).

---

## 9. Data Requirements
### Core Entities:
*   **Incident:** `id, type, status, severity, location {lat, lng}, description, hazards[]`.
*   **AgentResult:** `agent_name, findings, recommendations, confidence_score, moss_refs[]`.
*   **ResponsePlan:** `version, actions[], rationale, status (draft/approved), timestamp`.
*   **AuditLog:** `actor, action_type, details, timestamp`.

---

## 10. API Specifications (Key Endpoints)
*   `POST /api/incidents`: Create a new incident and initialize Moss context.
*   `GET /api/incidents/{id}/analyze`: Trigger the Commander Agent to run the full multi-agent pipeline.
*   `POST /api/incidents/{id}/updates`: Add new info and trigger dynamic reassessment.
*   `POST /api/livekit/token`: Generate secure WebRTC tokens for voice collaboration.
*   `GET /api/incidents/{id}/context`: Retrieve semantic history from Moss.

---

## 11. Security Requirements
*   **Authentication:** JWT-based auth for operators.
*   **Authorization:** Role-based access (Coordinator vs. Observer).
*   **Data Protection:** Geolocation data is only accessed via browser-native APIs after explicit user opt-in.
*   **Audit Trail:** Every agent decision and human approval is logged with a non-repudiable timestamp.

---

## 12. Deployment & Infrastructure
*   **Containerization:** Dockerized FastAPI backend.
*   **CI/CD:** GitHub Actions for automated testing and deployment.
*   **Environment Management:** Strict separation of secrets (Gemini API Key, Moss Credentials, MongoDB URI).

---

## 13. Success Metrics
*   **Agent Coordination:** 100% success rate in Commander delegating to all 6 agents.
*   **Context Relevance:** Moss retrieval returns relevant previous updates in >90% of test scenarios.
*   **Latency:** End-to-end plan generation in under 15 seconds.
*   **User Trust:** Successful demonstration of "Plan Revision" where the system explains *why* a plan changed based on new data.

---

## 14. Timeline & Milestones
*   **Phase 1 (Foundation):** Setup FastAPI, Next.js, and MongoDB.
*   **Phase 2 (Agents):** Implement Commander and Specialized Agents with Gemini.
*   **Phase 3 (Moss):** Integrate Moss for shared context and semantic history.
*   **Phase 4 (Real-Time):** Add LiveKit voice and Tactical Map.
*   **Phase 5 (Polish):** Simulation mode, UI/UX refinements, and demo recording.

---

## 15. Open Questions & Risks
*   **Risk:** Gemini API rate limits during high-concurrency agent execution. *Mitigation: Implement request queuing and exponential backoff.*
*   **Risk:** Moss context drift in extremely long-running incidents. *Mitigation: Implement periodic context summarization.*
*   **Risk:** Hallucinations in medical/rescue advice. *Mitigation: Strict system prompting and mandatory human review gate.*
*   **Question:** Should we support offline mode? *Decision: Out of scope for hackathon; requires active internet for LLM/Moss.*

---
**Final Pitch:** RESCUEGRID AI transforms emergency response from a chaotic race against time into a coordinated, intelligent collaboration between humans and AI, powered by the speed of Moss and the reasoning of Gemini.