# DRISHTI: Conversational AI & Crime Analytics Platform

**DRISHTI** is an intelligent, unified crime intelligence and data-linkage platform designed for the **Karnataka State Police (KSP)**. Built on a serverless, relational architecture using **Zoho Catalyst** (Data Store, NoSQL, Stratus, Zia Services, and QuickML), DRISHTI bridges the gap between massive historical databases and real-time investigative operations.

## Key Features (8 Integrated AI Systems)

DRISHTI combines 8 specialized AI components into a high-performance, dark-themed dashboard:

1. **AI #1: Conversational RAG Engine (QuickML RAG)**
   Allows officers to query FIR records using plain natural language (English/Kannada) and receive structured, source-cited responses.
2. **AI #2: Optical Character Recognition (Zia OCR)**
   Converts scanned paper FIR files and handwritten Kannada scripts into indexable, digital text.
3. **AI #3: Named Entity Recognition (Zia Text Analytics)**
   Scans unstructured narratives to automatically tag and resolve names, phone numbers, locations, and vehicle plates.
4. **AI #4: Time Series Forecasting (QuickML Time Series)**
   Analyzes seasonal and localized crime historical trends to forecast crime risk spikes for proactive patrols.
5. **AI #5: Real-time Anomaly Detection (QuickML Anomaly)**
   Continuously monitors FIR rates across jurisdictions to trigger immediate alerts on abnormal overnight surges.
6. **AI #6: Identity & Forensic Document AI (Zia Identity Scanner)**
   Extracts structures from bank passbooks, cheques, and ID cards to flag suspicious money flows (e.g. Hawala networks).
7. **AI #7: Modus Operandi Similarity Matching (LLM Embeddings)**
   Compares crime behavioral characteristics and signatures to link serial offenses across stations.
8. **AI #8: Criminal Network Link Analysis (SNA Graph)**
   Builds a dynamic connection map of co-accused, shared phone lines, vehicles, and cases to flag key coordinators.

---

## Project Architecture

```
The_Black_Swans/
├── client/                     # Vite + React (TypeScript) UI Frontend
│   ├── src/
│   │   ├── services/api.ts     # API Client (Backend routing & fallbacks)
│   │   ├── App.tsx             # Interactive dashboard & tabs
│   │   ├── App.css             # Glassmorphic and dashboard custom layout styles
│   │   └── main.tsx
│   └── package.json
├── server/                     # Node.js + Express Backend Service
│   ├── src/
│   │   ├── routes/ai.ts        # AI module mock/stub endpoints
│   │   └── index.ts            # Express entrypoint
│   └── package.json
└── README.md                   # Project overview & running instructions
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 1. Start the Backend Express Server
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:5000`.

### 2. Start the Frontend React Client
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` (or the port specified by Vite) in your browser to interact with the DRISHTI platform dashboard.

---

## Governance & Traceability
- **Audit Trails**: Every conversational prompt and data export is ledgered to the `audit_event` and `model_reasoning_trace` relational tables in the Catalyst Data Store.
- **Data Protection**: Masking of fields based on user access levels (Supervisors vs Patrol Officers) to align with India's DPDP Act 2023.
