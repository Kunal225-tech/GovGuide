# GovGuide Bihar — AI-Powered Civic Welfare Discovery & Deterministic Eligibility Platform

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9%20%7C%206.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js&logoColor=white)](https://expressjs.com/)
[![Python](https://img.shields.io/badge/Python-FastAPI%200.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector%20DB-DC2626?logo=qdrant&logoColor=white)](https://qdrant.tech/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-Flash%20%2B%20Embeddings-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**GovGuide Bihar** is a bilingual (**English** / **हिंदी**) civic discovery and eligibility platform engineered to bridge the accessibility divide for welfare programs across Bihar. It unifies state-specific initiatives (such as *Saat Nischay-1 & 2*, *Bihar Laghu Udyami Yojana*, *Kanya Utthan*, and *Student Credit Card*) and nationwide Central flagship schemes (*PM-KISAN*, *Ayushman Bharat*, *PMAY-G*) into an intuitive, high-speed, and verified civic portal.

---

## 🏛️ System Overview & Tech Stack

GovGuide Bihar is architected as three decoupled services operating under a strict separation of concerns:

| Layer | Runtime / Framework | Core Libraries & Tooling | Endpoints & Storage |
| :--- | :--- | :--- | :--- |
| **Frontend** | **React 19** + **TypeScript** + **Vite 8** | Tailwind CSS v3, Radix UI primitives, Lucide React, Framer Motion, `i18next` + `react-i18next` | Port `:5173`<br>Bilingual UI, zero runtime CSS overhead, native `fetch` client |
| **Backend** | **Node.js** + **Express 5** + **TypeScript** | Mongoose ODM v9, JWT, bcryptjs, CORS, dotenv | Port `:5000`<br>Stateful API, JWT auth, schema validation, deterministic rule engine |
| **AI Microservice** | **Python 3.10+** + **FastAPI** + **Uvicorn** | Google GenAI SDK (`google-genai`), Qdrant Client, PyMongo, Pydantic v2, httpx | Port `:8000`<br>Hybrid RAG pipeline, multi-turn chat (`Ask Saathi`), NLP profile parser |
| **Databases** | **MongoDB** + **Qdrant Vector DB** | MongoDB 6+ (`govguide`), Qdrant (`govguide_schemes` collection) | Port `:27017` (MongoDB)<br>`./qdrant_storage` (768-dim Cosine vectors) |

---

## 🚀 Key Engineering Highlights (With Verified Metrics)

### 1. Strict Architectural Boundary: Deterministic vs. Generative AI
GovGuide enforces a zero-tolerance policy for hallucinations in welfare qualification. Citizens' livelihoods depend on accurate eligibility assessments:
- **100% Deterministic Rule Engine (`eligibilityService.ts`):** Evaluates applicant demographics (age bounds, gender, income caps, education, occupation, social category) against 1:1 `EligibilityRule` records.
- **Safety Gates & Verification Flags:** Schemes lacking complete machine rules are explicitly gated as `unverified` with actionable documentary instructions, never issuing false-positive approvals.
- **Comprehensive Coverage:** Covers **42 verified schemes** (**36 Bihar State + 6 Central Flagship**), validated by **72/72 passing automated test assertions** (`npm run test:eligibility`).

### 2. Grounded Bilingual RAG Pipeline (`Ask Saathi`)
A domain-tuned civic assistant capable of conversing naturally in English, Hindi, and Hinglish while remaining strictly grounded in verified policy facts:
- **Semantic Vector Storage:** Indexes **168 curated scheme chunks** (`overview`, `eligibility`, `benefits`, `process`) into **Qdrant** using 768-dimensional `gemini-embedding-001` vectors.
- **Bilingual Boost & Alias Expansion:** Automatically maps regional scheme abbreviations (`BLUY`, `BRFSY`, `SJY`, ` सात निश्चय`, `लघु उद्यमी`, `वृद्धजन पेंशन`) to official canonical scheme titles before vector distance scoring.
- **Strict Citation & Refusal Guardrails:** Employs an exact citation extractor that verifies every grounded claim against indexed passages. If retrieved relevance falls below confidence thresholds, the assistant gracefully triggers a grounded refusal rather than speculating.

### 3. Fault-Tolerant NLP Profile Extractor (`AI Quick Profile Fill`)
Transforms free-form conversational inputs into typed citizen profile records:
- **Pre-LLM Privacy & PII Redaction:** Masks Aadhaar numbers, phone numbers, email addresses, and account numbers client- and server-side before prompts reach cloud LLM endpoints.
- **4-Model Gemini Resilient Failover Chain:** Seamlessly falls back across `gemini-3.5-flash` $\to$ `gemini-3.5-flash-lite` $\to$ `gemini-flash-latest` $\to$ `gemini-2.5-flash` to withstand rate limits (`429`) or provider degradation.
- **Deterministic Regex & Geography Normalizer:** Maps local colloquialisms and administrative classifications across all **38 Bihar districts** and official social category designations (`BC-1` $\to$ `EBC`, `BC-2` $\to$ `BC`, `Harijan` $\to$ `SC`), verified by **13/13 passing unit tests**.

### 4. Automated Multi-Stage Scheme Ingestion Pipeline
An extensible ETL ingestion architecture (`backend/src/pipeline/`) supporting enterprise onboarding of welfare schemes from CSV, JSON, and administrative data feeds:
- `Adapter` $\to$ `Normalizer` $\to$ `Validator` $\to$ `Deduplicator` $\to$ `AuditLogger`.
- Ensures verified category enums, normalized currency fields, and automated audit trails.

---

## 📐 System Architecture Diagram

```mermaid
flowchart LR
    Browser["Citizen Browser SPA\n(React 19 + Vite :5173)"]
    ViteProxy["Vite Dev Proxy\n(Port :5173)"]
    Express["Express REST API\n(Node.js / TS :5000)"]
    FastAPI["FastAPI AI Microservice\n(Python :8000)"]
    MongoDB[("MongoDB 6+\n('govguide')")]
    Qdrant[("Qdrant Vector DB\n('govguide_schemes')")]
    Gemini["Google Gemini API\n(Flash + Embeddings)"]

    Browser -->|"HTTP / REST"| ViteProxy
    ViteProxy -->|"/api/*"| Express
    ViteProxy -->|"/ai-service/*"| FastAPI
    Browser -.->|"Direct Fallback (aiApi.ts)"| FastAPI

    Express <-->|"Mongoose ODM (Schemes, Rules, Users, Apps)"| MongoDB
    FastAPI -->|"PyMongo (Ingestion Read)"| MongoDB
    FastAPI <-->|"768-dim Cosine Search"| Qdrant
    FastAPI <-->|"Chat Generation & Vector Embeddings"| Gemini
```

---

## 📂 Project Structure

```text
govguide/
├── README.md                      # This flagship documentation
├── PROJECT_ARCHITECTURE.md        # Comprehensive 700+ line technical architecture
├── CURRENT_FUNCTIONALITIES.md     # Feature and UI component inventory
├── FLOW.MD                        # User journey and data-flow specifications
├── start-dev.bat                  # One-click Windows development environment launcher
│
├── frontend/                      # React 19 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/            # Atomic UI components, banners, widgets, modals
│   │   ├── context/               # AuthContext, SavedSchemesContext, AiAssistantContext
│   │   ├── pages/                 # HomePage, SchemesPage, SchemeDetailsPage, ProfilePage, etc.
│   │   ├── services/              # api.ts, aiApi.ts (dual-path resilient AI client)
│   │   ├── i18n/                  # Bilingual localization bundles (en.json, hi.json)
│   │   └── types/                 # Scheme, User, Profile, Application TypeScript schemas
│   ├── package.json
│   └── vite.config.ts             # Dev proxy for :5000 and :8000
│
├── backend/                       # Node.js + Express 5 + TypeScript REST API
│   ├── src/
│   │   ├── controllers/           # authController, schemeController, applicationController
│   │   ├── models/                # Scheme, EligibilityRule, User, Application (Mongoose)
│   │   ├── routes/                # schemeRoutes, authRoutes, applicationRoutes
│   │   ├── services/              # eligibilityService (Deterministic Engine), authService
│   │   ├── pipeline/              # ETL Ingestion: adapters, normalizers, deduplicator
│   │   └── scripts/               # seedSchemes.ts, verifyEligibilityEngine.ts
│   └── package.json
│
├── ai-services/                   # Python + FastAPI RAG & NLP Microservice
│   ├── app/
│   │   ├── api/v1/                # chat.py (Ask Saathi), profile.py (NLP Extract), ingest.py
│   │   ├── core/                  # llm.py (Gemini failover), embeddings.py, vector_store.py
│   │   ├── ingestion/             # chunker.py (Semantic 4-chunk split), indexer.py
│   │   ├── rag/                   # retriever.py (Bilingual boost), generator.py (Guardrails)
│   │   └── main.py                # FastAPI lifecycle, CORS, health checks
│   ├── tests/                     # test_profile_normalizer.py (13 unit test cases)
│   ├── qdrant_storage/            # Local persistent vector store files
│   └── requirements.txt
│
└── data/
    └── bihar/
        ├── all_bihar_schemes.json # 42 curated Bihar + Central verified schemes
        └── build_bihar_dataset.js # Canonical dataset generator script
```

---

## ⚡ Quick Start & Setup Guide

### 1. Prerequisites
- **Node.js**: `v18.x` or `v20.x`+ (`v22` recommended)
- **Python**: `3.10` or `3.11`+
- **MongoDB**: Local Community Server running at `mongodb://127.0.0.1:27017`
- **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)

---

### 2. Environment Configuration

#### Backend Setup (`backend/.env`)
Copy the provided template and verify port and database connections:
```bash
cd backend
cp .env.example .env
```
*`backend/.env`:*
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/govguide
JWT_SECRET=govguide-super-secure-production-jwt-secret-key-32chars
NODE_ENV=development
```

#### AI Services Setup (`ai-services/.env`)
Copy the template and provide your Gemini API key:
```bash
cd ../ai-services
cp .env.example .env
```
*`ai-services/.env`:*
```env
HOST=127.0.0.1
PORT=8000
ENVIRONMENT=development
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-004
QDRANT_COLLECTION=govguide_schemes
QDRANT_STORAGE_PATH=./qdrant_storage
MONGODB_URI=mongodb://127.0.0.1:27017/govguide
CORS_ORIGINS=http://localhost:5173,http://localhost:5000
```

---

### 3. Database Seeding & Vector Ingestion

Populate MongoDB with the 42 curated schemes and 42 deterministic eligibility rules:
```bash
cd backend
npm run seed
```

Synchronize the Qdrant semantic vector index (extracts schemes from MongoDB, splits into 168 chunks, computes embeddings, and indexes them):
```bash
curl -X POST http://127.0.0.1:8000/api/v1/ingest/schemes \
     -H "Content-Type: application/json" \
     -d "{\"recreate_collection\": true}"
```
*Expected response:*
```json
{
  "success": true,
  "schemes_processed": 42,
  "chunks_created": 168,
  "points_indexed": 168,
  "collection_name": "govguide_schemes",
  "message": "Successfully indexed 168 scheme passages into 'govguide_schemes'."
}
```

---

### 4. Running the Development Services

#### Option A: One-Click Windows Startup
From the repository root, run:
```cmd
start-dev.bat
```
This spawns three dedicated terminal processes:
1. **Backend API**: `http://localhost:5000`
2. **AI Microservice**: `http://127.0.0.1:8000`
3. **Frontend Application**: `http://localhost:5173`

#### Option B: Manual Startup (Three Terminals)

**Terminal 1 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — AI Services:**
```bash
cd ai-services
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Verification & Test Suites

GovGuide includes comprehensive automated verification suites across all three architectural layers:

### 1. Deterministic Rule Engine Test Suite (72 Assertions)
Validates age bounds, income caps, gender filters, education equivalences, category exemptions, and multi-reason disqualifications:
```bash
cd backend
npm run test:eligibility
```
```text
======================================================================
Verification Complete: 72/72 tests passed (0 failures)
======================================================================
```

### 2. AI Profile Normalizer Unit Tests (13 Test Cases)
Verifies PII scrubbing, Hinglish parsing, 38-district extraction, caste normalization, and graceful LLM fallback:
```bash
cd ai-services
python -m unittest discover -s tests
```
```text
----------------------------------------------------------------------
Ran 13 tests in 0.022s

OK
```

### 3. Frontend Quality Gates & Production Build
Checks strict TypeScript typing, React hooks dependencies, Tailwind styling, and production bundling:
```bash
cd frontend
npm run lint
npm run build
```
```text
> frontend@0.0.0 lint
> eslint .

> frontend@0.0.0 build
> tsc -b && vite build
✓ 2022 modules transformed.
✓ built in 7.73s
```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).

