# DRISHTI: Crime Intelligence & Analytics Dashboard (Zoho Catalyst Edition)

DRISHTI is an intelligent, full-stack crime intelligence and analytical portal built for the **Karnataka State Police (KSP)**. The platform is designed to be 100% compliant with the **Zoho Catalyst** serverless ecosystem, utilizing its native cloud capabilities for deployment, storage, security, and AI analytics.

---

## 👥 Developers (The Black Swans)
- **Neav Panjwani**
- **Gautam Doliya**
- **Manya Nirvan**

---

## 🚀 Key Features & Zoho Catalyst Mapping

DRISHTI incorporates advanced analytical and conversational capabilities grounded in criminology and sociology:

| Capability / Feature | Description | Required Catalyst Service |
| :--- | :--- | :--- |
| **Relational Database** | Stores crime entries, suspects, victims, acts, and locations matching the official KSP FIR ER-Diagram. | **Catalyst Data Store** |
| **Conversational RAG Engine** | A vector-search style chatbot that references CCTNS records. | **Catalyst QuickML & Zia Services** |
| **Bilingual OCR & NER** | Client-side Kannada/English text extraction from complaints with AI-driven entity highlighting. | **Zia Text Analytics & OCR** |
| **Chronological Timeline** | Interactive case investigation milestone tracker for officer decision-making support. | *Client UI Component (Zia processed)* |
| **Financial Document AI** | Parses transaction logs from seized bank passbooks to flag fraud patterns. | **Zia Document AI / SmartBrowz** |
| **Voice Q&A Interface** | Bilingual Voice Search (STT) and Voice Q&A Readout (TTS) supporting English and Kannada. | **Zia Voice / Web Speech API** |
| **PDF Briefing Reports** | Officer briefing summaries exported to a PDF document. | **Catalyst SmartBrowz** |
| **Secure Authentication** | Multi-role identity verification with access control restrictions. | **Catalyst Authentication** |
| **Hosting & API Gateway** | Deploying front-end assets and routing secure API requests to containerized functions. | **Web Client Hosting & API Gateway** |

---

## 🛠️ Tech Stack & Architecture

### **Frontend (`client/`)**
* **Core**: React 18, TypeScript, Vite
* **Styling**: Vanilla CSS (Custom light sage-grey responsive design system)
* **SDK**: Zoho Catalyst Web SDK 3.0.0 (dynamically initialized on page load)
* **Audio**: Native Web Speech Synthesis (TTS) & Speech Recognition (STT) configured for `en-IN` & `kn-IN` context.

### **Backend (`server/`)**
* **Core**: Node.js, Express, TypeScript
* **ORM**: Zoho Catalyst Data Store Adapter (simulated locally using Mongoose/JSON)
* **Middleware**: Role-Based Access Control (RBAC) verification verifying `x-user-role` and `x-badge-number` headers.

---

## 📁 Project Structure

```text
The_Black_Swans/
├── client/                         # React Frontend (Vite)
│   ├── index.html                  # Main HTML entry loading Zoho SDK
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatView.tsx        # Bilingual Chat + PDF Export + Voice STT/TTS
│   │   │   ├── OcrView.tsx         # Document OCR + Relational Fields + Case Timeline
│   │   │   ├── LoginView.tsx       # Hybrid Catalyst Auth & Mock credentials adapter
│   │   │   ├── DashboardView.tsx   # Overviews, anomalies, and analytics metrics
│   │   │   ├── Icons.tsx           # Premium React SVG components
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts              # API calls carrying active session headers
│   │   ├── App.tsx                 # Main layout routing + active session state
│   │   └── main.tsx                # App entrypoint
│   └── package.json
└── server/                         # Express Backend (AppSail target)
    ├── src/
    │   ├── config/                 # DB connections & variables
    │   ├── models/                 # Database schema models (aligned to KSP ER-Diagram)
    │   ├── routes/                 # Express REST endpoints
    │   └── index.ts                # Express bootstrap entrypoint
    └── package.json
```

---

## 💻 How to Run Locally

### **1. Run the Backend Server**
Go to the server directory, install packages, and start the development server:
```bash
cd server
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`.

### **2. Run the Frontend Client**
Go to the client directory, install packages, and start the Vite server:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Zoho Catalyst Deployment Steps

### **1. Frontend Hosting (Catalyst Slate / Web Client)**
1. Enable hosting in the **Zoho Catalyst Console**: `Cloud Scale` -> `Hosting` -> `Web Client`.
2. Install the Catalyst CLI: `npm install -g zcatalyst-cli`.
3. Log in: `catalyst login`.
4. Deploy: `catalyst deploy --webclient`.

### **2. Backend Runtime (AppSail)**
1. Deploy your server folder as an AppSail target using the `app-config.json` configuration file.
2. Setup the **API Gateway** mapping rules to securely forward `/api/*` requests to your container runtime.

### **3. Database Setup (Data Store)**
* Create the tables (`CaseMaster`, `Accused`, `Victim`, `ActSectionAssociation`) in the Catalyst console as per schemas defined in `drishti_backend_updates.md`.

---

## 🔐 Demo Credentials & RBAC Access Matrix

The login screen enforces strict **Role-Based Access Control (RBAC)** based on your officer credentials. Logging in automatically registers session credentials and custom headers on all API requests:

| Role | Officer Badge ID | Access PIN | Allowed Views |
| :--- | :--- | :--- | :--- |
| **Investigator** | `KSP-7482` | `password` | **Full Access** (Dashboard, RAG Chat, OCR timeline, passbook, mod match, graph) |
| **Analyst** | `KSP-9921` | `password` | **Intelligence Analysis** (All except Conversational Chat View) |
| **Supervisor** | `KSP-1042` | `password` | **Overview & Case Match** (All except OCR & Document parser views) |
| **Policymaker** | `KSP-2030` | `password` | **Policy Metrics Only** (Dashboard only, with aggregated state-wide analytics) |
