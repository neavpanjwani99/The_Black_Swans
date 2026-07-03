# DRISHTI: Crime Intelligence & Analytics Dashboard (Prototype)

DRISHTI is a full-stack prototype dashboard built with React (frontend) and Node/Express (backend) to showcase crime intelligence features for the Karnataka State Police (KSP).

## Developers
- **Neav Panjwani**
- **gautam doliya**
- **Veera Gupta**
- **Manya Nirvan**

---

## Project Status & Features

This repository contains a working prototype of the dashboard. The features are mocked on the backend to demonstrate how the final system will function:

1. **Dashboard Overview**: Displays active investigations, overnight anomalies, and trend forecasts.
2. **Conversational Search**: A vector-search style chatbot interface that references FIR records.
3. **Kannada OCR & Entity Extractor**: Extracts details from complaint files and highlights names, phone numbers, and locations.
4. **Financial Document AI**: Parses transaction lists from seized passbooks to highlight suspicious withdrawals.
5. **Modus Operandi Matcher**: Identifies similar historical cases based on time, location, and entry methods.
6. **Network Connection Graph**: Visualizes co-accused networks, shared vehicles, and phone numbers in an interactive chart.

---

## Project Structure

```
The_Black_Swans/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Modular tab sub-views (Dashboard, Chat, OCR, etc.)
│   │   ├── services/api.ts     # API calls to backend & mock fallbacks
│   │   ├── App.tsx             # Main layout container shell
│   │   ├── App.css             # Light sage-grey dashboard styling
│   │   └── main.tsx
│   └── package.json
└── server/                     # Express Backend
    ├── src/
    │   ├── routes/ai.ts        # Dummy API endpoints for the 6 tabs
    │   └── index.ts            # Main Express entrypoint
    └── package.json
```

---

## How to Run Locally

### 1. Run the Backend Server
Go to the server directory, install packages, and start the development server:
```bash
cd server
npm install
npm run dev
```
The backend server runs on `http://localhost:5000`.

### 2. Run the Frontend Client
Go to the client directory, install packages, and start the Vite server:
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser to view the dashboard.
