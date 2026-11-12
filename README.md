# Public-CRM — Open-Source Customer Relationship & Sales Pipeline Manager

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary_%2F_Permission_Required-red?style=flat-square)](LICENSE.md)

**Public-CRM** is a streamlined, open-source customer relationship management system engineered for independent consultants, early-stage startups, and non-profits. It offers drag-and-drop Kanban deal pipelines, contact activity timelines, automated follow-up reminders, and sales velocity metrics without the bloat and pricing tiers of commercial CRM monoliths.

---

## Problem Statement & Context
Small organizations and startups struggle with commercial CRM software:
- **Excessive Complexity**: Enterprise platforms like Salesforce and HubSpot overwhelm small teams with hundreds of unnecessary enterprise features.
- **Aggressive Pricing Lock-In**: Per-user monthly seat costs quickly become unsustainable as startup teams expand.
- **Data Sovereignty Deficits**: User contact data and sales conversations are locked into proprietary vendor databases.

---

## Existing Solutions & Critical Gaps
| Feature | Commercial Monoliths | Public-CRM Platform |
| :--- | :--- | :--- |
| **Pricing** | $50–$300/user/month | **100% Free & Open-Source** |
| **Deployment** | Cloud-only locked | **Self-hosted / Cloud native** |
| **Setup Time** | Weeks of consultant onboarding | **Ready to use in 2 minutes** |

---

## Proposed Solution & Architectural Innovation
Public-CRM provides an **Agile Sales Pipeline Platform**:
- **Visual Kanban Deal Stages**: Drag-and-drop deals across Lead -> Contact Made -> Proposal Sent -> Negotiation -> Closed Won.
- **Unified Contact History**: Complete activity log documenting calls, emails, meeting notes, and deal value history.
- **Task & Follow-up Scheduler**: Integrated reminder engine ensuring sales reps never miss critical client touchpoints.
- **Export & Portability**: One-click CSV and JSON export guaranteeing complete data ownership.

---

## Technical Approach & System Architecture
```mermaid
flowchart LR
    User["Sales Representative"] --> UI["React Kanban Dashboard"]
    UI --> API["Express.js RESTful API"]
    API --> PipelineSvc["Deal Pipeline Service"]
    API --> ContactSvc["Contact Management Service"]
    PipelineSvc & ContactSvc --> DB[("PostgreSQL Database")]
```

### Component Deep-Dive & Execution Flow
1. **Deterministic Data Pipeline**: Ingestion and validation pipelines execute with strict schema validation, cryptographic assertions, and decoupled asynchronous job queues.
2. **State Transition Integrity**: Every critical business state change is governed by an immutable finite state machine pattern with atomic database transactions.
3. **Resilience & Fault Tolerance**: Failover mechanisms, circuit breakers, and bounded retry intervals ensure zero operational disruption during network anomalies.

---

## Quantifiable Impact & Measurable Benefits
- **100% Elimination of Per-Seat Licensing Fees**: Zero software costs for expanding sales teams.
- **Immediate Team Adoption**: Intuitive task-manager design requires zero user training.
- **Complete Data Sovereignty**: Full control over customer databases and privacy compliance.

---

## Feasibility, Operational Viability & Scalability
- **Deployability**: Deploys via Docker in under 60 seconds on any cloud VPS or local server.

---

---

## Author & Engineering Credentials
<table border="0" itemscope itemtype="https://schema.org/Person">
  <tr>
    <td width="130" align="center" valign="middle">
      <img src="https://github.com/Tharun4743.png" width="105" style="border-radius: 6px;" alt="Tharunkumar K — Full Stack Developer & AI Systems Engineer at V.S.B. Engineering College" title="Tharunkumar K — V.S.B. Engineering College (VSBEC)" itemprop="image" />
    </td>
    <td>
      <h3 itemprop="name">Tharunkumar K</h3>
      <p>
        <b itemprop="jobTitle">Full Stack Developer & AI Systems Engineer</b> | <b>V.S.B. Engineering College (VSBEC)</b><br/>
        🎓 <b>B.Tech in Information Technology</b> — <b>V.S.B. Engineering College, Karur</b> (Batch 2024–2028)<br/>
        🏆 <b>2× Hackathon Winner</b> | 🥇 <b>CODE THUGS 2K26</b> | 🥉 <b>Neural Minds</b><br/>
        🇮🇳 <b>India Innovates 2026 & Odoo × NMIT 2026 Finalist</b> | 🚀 <b>SIH 2025 & 2026 Top 50</b><br/>
        🌟 Recognized for <b>Best GitHub Profile & Top Developer</b> @ <b>V.S.B. ENGINEERING COLLEGE</b>
      </p>
      <p>
        🚀 <b>Top Flagship Engineering Projects:</b><br/>
        • 🏛️ <b>TaskManager (VSBEC IT Vault)</b> — Institutional Task Governance & LeetCode/GitHub Sync &nbsp;<a href="https://github.com/Tharun4743/Taskmanager"><img src="https://img.shields.io/badge/Code-181717?style=flat-square&logo=github&logoColor=white" alt="Code" /></a>&nbsp;<a href="https://it-taskmanager.vercel.app/"><img src="https://img.shields.io/badge/Live_Demo-10B981?style=flat-square&logo=vercel&logoColor=white" alt="Live Demo" /></a><br/>
        • 🧠 <b>AURA</b> — Air-Gapped Local Multimodal RAG Engine & Offline AI Assistant &nbsp;<a href="https://github.com/Tharun4743/AURA"><img src="https://img.shields.io/badge/Code-181717?style=flat-square&logo=github&logoColor=white" alt="Code" /></a><br/>
        • 🪖 <b>Smart Helmet IoT</b> — SIH Top 50 Dual-Unit Motorcycle Accident Prevention System &nbsp;<a href="https://github.com/Tharun4743/AGILE-INNOVATORS-smart-helmet-"><img src="https://img.shields.io/badge/Code-181717?style=flat-square&logo=github&logoColor=white" alt="Code" /></a><br/>
        • ⚡ <b>GOAT-CE</b> — Isolated Distributed Multi-Language Code Execution Sandbox &nbsp;<a href="https://github.com/Tharun4743/GOAT-CE"><img src="https://img.shields.io/badge/Code-181717?style=flat-square&logo=github&logoColor=white" alt="Code" /></a>
      </p>
      <p>
        <a href="https://tharunkumark4743.netlify.app/"><img src="https://img.shields.io/badge/Portfolio-0284c7?style=flat-square&logo=googlechrome&logoColor=white" alt="Portfolio" /></a>&nbsp;
        <a href="https://github.com/Tharun4743"><img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" alt="GitHub" /></a>&nbsp;
        <a href="https://www.linkedin.com/in/tharunkumark4743"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>&nbsp;
        <a href="https://leetcode.com/u/Tharunkumar__K/"><img src="https://img.shields.io/badge/LeetCode-FFA116?style=flat-square&logo=leetcode&logoColor=white" alt="LeetCode" /></a>&nbsp;
        <a href="mailto:tharunkumark42007@gmail.com"><img src="https://img.shields.io/badge/Email-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email" /></a>
      </p>
    </td>
  </tr>
</table>
