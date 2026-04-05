<div align="center">
  <img src="frontend/public/vite.svg" alt="TranslateIQ Logo" width="100"/>
  <h1>TranslateIQ</h1>
  <p><strong>Adaptive Hybrid Enterprise Machine Translation Engine</strong></p>

  [![Python](https://img.shields.io/badge/Python-FastAPI-blue?logo=python&logoColor=white)](https://fastapi.tiangolo.com)
  [![React](https://img.shields.io/badge/React-Zustand-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
  [![Qdrant](https://img.shields.io/badge/Vector-Qdrant-red?logo=qdrant&logoColor=white)](https://qdrant.tech/)
  [![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![PyTorch](https://img.shields.io/badge/AI_Edge-PyTorch-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org/)

</div>

---

## 📖 Overview
**TranslateIQ** is a highly proprietary, hybrid-edge Machine Translation platform built specifically for enterprise localization. 

Generic Cloud LLMs (like ChatGPT) are expensive, leak confidential data, and hallucinate exact terminologies. TranslateIQ solves this by completely rethinking the translation pipeline. We utilize an **Adaptive Edge Router** that mixes parallel Cloud-Processing (OpenRouter) for raw texts, with an isolated **PyTorch Local Inference Engine** for fuzzy matches, preventing data leakage and dropping token costs by over 80%.

## 🚀 Key Innovations
- **JIT (Just-In-Time) Fine-Tuning:** The platform learns silently. As linguists approve translations, the backend harnesses implicit *Telemetry Signals* to dynamically generate **PEFT/LoRA (Low-Rank Adaptation)** models. Your local edge model evolves instantly without requiring massive overnight training budgets.
- **Hierarchical Chunking:** Why pay an LLM to translate a paragraph if 4 out of 5 sentences match the Translation Memory? TranslateIQ strips paragraphs down to the sub-sentence logic, only translating the missing words, and dynamically stitches them together.
- **Reciprocal Rank Fusion (RRF):** Our matching engine doesn't just rely on semantic vectors. We fuse **Qdrant (BGE-M3 Dense Vectors)** with **BM25 (Sparse Keyword Maps)** to guarantee that strict numbers and 1-letter acronyms match perfectly.
- **Dual-Agent Validation:** Before translation happens, documents are routed through strict Regex formatting checks and evaluated by a secondary *Claude 3.5 Sonnet* Validation Agent running strictly as a compliance arbiter.

---

## ⚙️ Core Architecture & Flowchart

```mermaid
graph TD
    User([User Upload (.docx)]) --> Parse[Docling Visual Parser]
    Parse --> Validate[Claude 3.5 Sonnet Validator]
    Validate --> HybridSearch[Qdrant Dense + BM25 Sparse]
    
    HybridSearch -- exact_match ≥ 0.98 --> AutoApprove[Auto-Approved]
    HybridSearch -- fuzzy_match ≥ 0.85 --> MatchEngine[Hierarchical Splitting Engine]
    HybridSearch -- new_match < 0.85 --> MatchEngine
    
    MatchEngine --> RouteLogic{Adaptive Router}
    
    RouteLogic -- New / Cloud Segment --> CloudEval[OpenRouter API<br/>10 Concurrent AI Batches]
    RouteLogic -- Fuzzy / Local Segment --> MutexQueue[LocalInferenceManager]
    
    MutexQueue --> PyTorch[Helsinki-NLP PyTorch Model]
    
    CloudEval --> Review[React / Zustand UI]
    PyTorch --> Review
    AutoApprove --> Review
    
    Review -- Approve All --> TMUpdate[(Supabase + Qdrant TM)]
    Review -- Approvals --> Telemetry[(Telemetry Signals)]
    
    Telemetry -- Next Session Trigger --> JIT[JIT PEFT/LoRA Pipeline]
    JIT -- Evolves Locally --> PyTorch
```

---

## 🛠️ The Technology Stack
### Frontend
- **Framework:** React 18 / Vite
- **State Management:** Zustand, TanStack Query
- **Styling & Animation:** TailwindCSS, Framer Motion
- **Architecture:** The UI tracks live translation WebSocket polling and displays exact visual matching properties (New, Fuzzy, Exact).

### Backend
- **Framework:** Python / FastAPI / Uvicorn Server
- **Database (Relational):** Supabase (PostgreSQL) + async SQLAlchemy
- **Database (Vector):** Qdrant Serverless
- **AI Core:** Transformers, PEFT, Tokenizers
- **Document Processing:** Docling, Python-DOCX

---

## 💻 Local Setup & Development

### 1. Backend Setup
Navigate to the `/backend` directory and set up your Python environment:
```bash
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
```

Set your `.env` variables:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
SUPABASE_DATABASE_URL="postgresql://user:password@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
QDRANT_URL="https://your-cluster.us-east4-0.gcp.qdrant.tech"
QDRANT_API_KEY="your-api-key"
OPENROUTER_API_KEY="sk-or-v1-..."
HF_TOKEN="hf_..."
```

Run the FastAPI Application:
```bash
python start_backend.py
# Or run manually: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
Navigate to the `/frontend` directory:
```bash
npm install
npm run dev
```
Navigate to `http://localhost:5173` to see TranslateIQ come alive.

---

> Designed & Architected for High-Performance Enterprise AI Integration. 
