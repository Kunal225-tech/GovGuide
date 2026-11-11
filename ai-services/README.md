# GovGuide AI Services 🤖

High-performance AI microservice powering the **GovGuide** citizen welfare platform. Built with **FastAPI**, **Google Gemini LLM**, and **Qdrant Vector Database**.

---

## 🌟 Key Features

1. **GovGuide Saathi (Conversational RAG Assistant):**
   - Answers citizen welfare queries using verified Central and State government schemes.
   - Grounded strictly in indexed scheme data with official portal citations.
   - Dual-language support (**English** and **हिन्दी**).
   - Injects user profile demographics to provide personalized eligibility advice.

2. **Demographic Profile Extraction:**
   - Extracts structured demographics (`age`, `gender`, `state`, `district`, `annualIncome`, `occupation`, `education`, `category`) from conversational text into valid JSON for `User.profile`.

3. **Scheme Ingestion & Vector Indexing:**
   - Automatically chunks MongoDB scheme documents into semantic passages (Overview, Eligibility, Benefits, Documents & Process).
   - Embeds and indexes passages into Qdrant for semantic similarity retrieval.

---

## 📂 Project Architecture

```
ai-services/
├── venv/                       # Python Virtual Environment
├── requirements.txt            # Python Dependencies
├── .env                        # Local Environment Variables
├── .env.example                # Environment Variables Template
├── README.md                   # Service Documentation
└── app/
    ├── __init__.py
    ├── main.py                 # FastAPI Entrypoint & Lifespan
    ├── config.py               # Pydantic Settings & Environment Loading
    ├── api/                    # API Route Handlers
    │   └── v1/
    │       ├── chat.py         # POST /api/v1/chat (RAG Assistant)
    │       ├── profile.py      # POST /api/v1/profile/extract (LLM Extractor)
    │       └── ingest.py       # POST /api/v1/ingest/schemes (Vector Ingestion)
    ├── core/                   # Core Clients & Managers
    │   ├── llm.py              # Google Gemini LLM Service
    │   ├── embeddings.py       # Dense Vector Embeddings Service
    │   └── vector_store.py     # Qdrant Client & Collection Manager
    ├── ingestion/              # Data Processing Pipeline
    │   ├── chunker.py          # Semantic Document Chunker
    │   └── indexer.py          # MongoDB Scheme Vector Ingestion
    ├── rag/                    # Retrieval-Augmented Generation
    │   ├── prompt_templates.py # Bilingual System Prompts & Guardrails
    │   ├── retriever.py        # Vector Similarity Search & Filtering
    │   └── generator.py        # Answer Assembly & Citation Formatter
    └── schemas/                # Pydantic Request & Response Models
        ├── chat.py
        ├── profile.py
        └── ingestion.py
```

---

## 🚀 Quickstart Guide

### 1. Activate the Virtual Environment

**Windows PowerShell:**
```powershell
cd ai-services
.\venv\Scripts\Activate.ps1
```

**Windows Command Prompt:**
```cmd
cd ai-services
venv\Scripts\activate.bat
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` if not already done, and add your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=text-embedding-004
```
*(Get a free key from [Google AI Studio](https://aistudio.google.com/))*

### 3. Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
Interactive Swagger API documentation will be available at:  
👉 **http://127.0.0.1:8000/docs**

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Service health & version status |
| `GET` | `/health` | Diagnostic health check (Gemini key status, DB status) |
| `POST` | `/api/v1/chat` | Conversational RAG assistant with grounded citations |
| `POST` | `/api/v1/profile/extract` | Converts conversational self-descriptions into structured profile JSON |
| `POST` | `/api/v1/ingest/schemes` | Chunks & indexes MongoDB schemes into Qdrant |

