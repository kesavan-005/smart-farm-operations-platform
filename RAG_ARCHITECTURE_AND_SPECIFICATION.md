# RAG Architecture & Technical Specification
## Smart Farm Operations Platform (Project Uzhavan)

---

## 1. Executive Overview

The **Retrieval-Augmented Generation (RAG)** system in the **Smart Farm Operations Platform (Project Uzhavan)** provides localized, hyper-personalized, and scientifically grounded agricultural advisory to farmers.

Rather than relying on generic, ungrounded LLM completions that can hallucinate unsafe chemical doses or improper agronomic practices, the platform implements a **Dual-Context Grounded RAG Architecture**:
1. **Authoritative Agricultural Knowledge Base**: Vector-indexed agronomy guides (e.g., Tamil Nadu Agricultural University - TNAU, ICAR, KVK) covering pest control, disease management, irrigation, and crop scheduling.
2. **Live Farm Operational Context**: Real-time farm telemetry and business records (soil type & pH, active crop growth stages, acreage, live weather forecasts, and on-farm inventory availability).

---

## 2. End-to-End System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FARMER / FRONTEND                                    │
│  React 19 + TypeScript + Vite PWA (AdvisoryWidget.tsx, ChatInput.tsx, ChatMessage.tsx)  │
│  Bilingual Interface (English ↔ தமிழ்)                                                 │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP POST /api/v1/farms/{farmId}/advisory
                                            │ Header: Authorization: Bearer <JWT>
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND: ADVISORY CONTROLLER                              │
│  com.smartfarm.features.advisory.controller.AdvisoryController                         │
│  • Enforces tenant isolation: path farmId overrides payload to prevent ID spoofing     │
│  • Extracts authenticated userId via @AuthenticationPrincipal                          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              CONTEXT ASSEMBLER SERVICE                                 │
│  com.smartfarm.features.advisory.service.ContextAssembler                              │
│                                                                                        │
│  ┌────────────────────────────────────┐    ┌────────────────────────────────────────┐  │
│  │       Farm Context Service         │    │      Knowledge Retrieval Service       │  │
│  │  • Farm Soil Type, Area, Location  │    │  • Top-K Semantic Similarity Search    │  │
│  │  • Active Crops & Growth Stages    │    │  • Max Distance Threshold (0.50)       │  │
│  │  • Live 7-Day Weather Forecast     │    │  • Metadata Filters (Crop, Lang, Topic)│  │
│  │  • Available Inventory Items       │    │  • Active Document Status Constraint   │  │
│  └─────────────────┬──────────────────┘    └───────────────────┬────────────────────┘  │
└────────────────────┼───────────────────────────────────────────┼───────────────────────┘
                     │                                           │
                     │ Relational Context                        │ Cosine Similarity Search
                     ▼                                           ▼
          ┌───────────────────────┐                  ┌────────────────────────┐
          │  PostgreSQL (Relational)│                 │ PostgreSQL + pgvector  │
          │  farms, crops, fields,│                  │ Table: vector_store    │
          │  inventory, weather   │                  │ Index: HNSW (384-dim)  │
          └───────────────────────┘                  └────────────────────────┘
                                                                 ▲
                                                                 │ Embeds Query (384-dim)
                                                     ┌───────────┴────────────┐
                                                     │ Local Embedding Model  │
                                                     │ all-MiniLM-L6-v2 (DJL) │
                                                     └────────────────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │ Both contexts combined into AdvisoryContext │
                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                GROUNDED PROMPT BUILDER                                 │
│  com.smartfarm.features.advisory.service.GroundedPromptBuilder                         │
│  • System Prompt: Strict anti-hallucination, anti-prompt-injection, citation rules     │
│  • User Prompt: Structured XML tags:                                                   │
│    <FARM_CONTEXT>          -> JSON of farm, soil, active crop stages, inventory        │
│    <AGRICULTURAL_KNOWLEDGE> -> Indexed and numbered sources [Source 1], [Source 2]... │
│    <WEATHER>               -> JSON of current conditions and rainfall probability      │
│    <FARMER_QUESTION>       -> Original farmer query                                    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             LLM INFERENCE & ORCHESTRATION                              │
│  com.smartfarm.features.advisory.service.AdvisoryOrchestrationService                  │
│  • Spring AI ChatModel Client                                                          │
│  • Temperature: 0.2 (Low variance, factual compliance)                                 │
│  • Configured Provider: Google Gemini 3.6 Flash via OpenAI Compatibility Layer         │
│  • Endpoint: https://generativelanguage.googleapis.com/v1beta/openai/chat/completions  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              TRACEABLE ADVISORY RESPONSE                               │
│  AdvisoryResponse:                                                                     │
│  • answer: Grounded, practical advice in farmer's preferred language                   │
│  • sources: Citations with Document Title, Authority, Chunk ID, Similarity Score       │
│  • weatherUsed: Boolean indicating if live weather influenced recommendation           │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Subsystems

### 3.1. Knowledge Ingestion Pipeline

The ingestion pipeline converts unstructured agricultural documents into semantically searchable vector chunks.

- **Class**: `com.smartfarm.features.knowledge.service.KnowledgeIngestionService`
- **Text Normalization** (`TextNormalizer.java`):
  - Strips zero-width unicode characters and anomalous control characters.
  - Normalizes whitespace while preserving paragraphs and bullet hierarchies.
  - Trims leading/trailing token noise.
- **Deterministic Chunking** (`DeterministicChunker.java`):
  - Default chunk size: **1,000 characters** (configurable via `smartfarm.knowledge.ingestion.chunk-size`).
  - Chunk overlap: **150 characters** (configurable via `smartfarm.knowledge.ingestion.chunk-overlap`).
  - Sentence-boundary aware: splits at punctuation (`.`, `!`, `?`, `\n\n`) to prevent cutting words or agronomic formulas in half.
- **Storage Dual-Write**:
  1. **Relational Record**: Persisted in `knowledge_documents` and `knowledge_chunks` with metadata (`title`, `crop`, `topic`, `authority`, `language`, `version`, `status`).
  2. **Vector Record**: Vector embeddings computed and written into PostgreSQL's `vector_store` table via `PgVectorStore.accept(List<Document>)`.

### 3.2. Vector Store & Embedding Infrastructure

- **Embedding Model**: `TransformersEmbeddingModel` (`all-MiniLM-L6-v2`)
  - **Type**: Local in-process ONNX neural embedding model (powered by Deep Java Library / PyTorch native runtime).
  - **Dimensions**: **384 dimensions**.
  - **Advantage**: Zero per-token API cost, zero external network latency, 100% offline capability for embedding generation.
- **Vector Database**: `PgVectorStore` (PostgreSQL with `pgvector` extension)
  - **Table**: `vector_store` (`id`, `content`, `metadata`, `embedding vector(384)`).
  - **Distance Metric**: `COSINE_DISTANCE`.
  - **Index Strategy**: **HNSW** (`Hierarchical Navigable Small World`) for sub-millisecond nearest-neighbor search.

### 3.3. Knowledge Retrieval Subsystem

- **Class**: `com.smartfarm.features.knowledge.service.KnowledgeRetrievalService`
- **Search Logic**:
  - Encapsulates queries into Spring AI `SearchRequest`.
  - **Similarity Threshold**: `0.50` maximum cosine distance (`smartfarm.knowledge.retrieval.max-distance`). Results with cosine distance higher than 0.50 are filtered out as non-relevant.
  - **Metadata Pre-filtering**:
    - `status = 'ACTIVE'` (prevents unapproved/draft knowledge chunks from being retrieved).
    - `crop = <dominantCrop>` (when field context is specific).
    - `language = <language>` (optional regional filter).
    - `topic = <topic>` (optional category filter: PEST, IRRIGATION, NUTRIENT, SCHEME).
  - Returns `List<KnowledgeRetrievalResult>` including chunk text, similarity score, source document title, authority, and version.

### 3.4. Context Assembly & Farm Grounding

- **Class**: `com.smartfarm.features.advisory.service.ContextAssembler`
- Dynamically gathers live farm status before the LLM is called:
  - **Soil Characteristics**: Soil type (e.g., *Red Loamy Soil*, *Black Clay*) and soil pH.
  - **Active Crop Context**: Active crop name, sowing date, estimated harvest date, and current phenological stage.
  - **Field Boundary**: If `fieldId` is passed, context is scoped specifically to that field and its active crop.
  - **Live Weather**: 7-day forecast from Open-Meteo including current temperature, humidity, rainfall probability, and weather alerts.
  - **Inventory Awareness**: On-farm stock levels of fertilizers, bio-pesticides, and seeds.

### 3.5. Grounded Prompt Engineering & Safety Guardrails

- **Class**: `com.smartfarm.features.advisory.service.GroundedPromptBuilder`
- Structures the system message with strict defense-in-depth instructions:
  1. **Strict Grounding**: Only use the provided `<FARM_CONTEXT>` and `<AGRICULTURAL_KNOWLEDGE>`. Never invent farm facts.
  2. **Insufficient Data Fallback**: If retrieved sources are empty or insufficient, explicitly acknowledge the limitation and avoid dangerous unsupported diagnoses.
  3. **Data vs Instruction Boundary**: Treats farmer input and retrieved chunks as passive `DATA` blocks inside XML tags to defeat prompt injection attempts.
  4. **System Secret Protection**: Strict instruction never to reveal API keys, database credentials, or internal system configurations.
  5. **Explicit Traceability**: Demands that recommendations cite sources using `[Source N]` tags corresponding to the retrieved knowledge chunks.

### 3.6. LLM Generation Layer (Gemini-Only)

- **Configuration**: `com.smartfarm.features.advisory.config.AIProviderConfig`
- **Provider**: **Google Gemini** as the **sole** LLM provider.
- **Model**: `gemini-3.6-flash` (or `gemini-1.5-flash` / `gemini-2.0-flash`).
- **Endpoint**: Google Generative Language OpenAI-compatible REST endpoint:
  `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- **Client**: Spring AI `OpenAiChatModel` and `OpenAiApi` pointed to the Google Gemini endpoint.
- **Credentials**: Reads `GEMINI_API_KEY` or `GOOGLE_API_KEY`. Throws an immediate, descriptive `IllegalStateException` on startup/runtime if credentials are missing (no dummy keys).
- **Inference Temperature**: `0.2` (configured in `smartfarm.ai.llm.temperature`) to minimize creativity and maximize factual adherence.

---

## 4. Database Schema Specification

### 4.1. Vector Store Table (`vector_store`)
Managed by Spring AI `PgVectorStore`:
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS vector_store (
    id VARCHAR(36) PRIMARY KEY,
    content TEXT,
    metadata JSONB,
    embedding vector(384)
);

CREATE INDEX IF NOT EXISTS vector_store_hnsw_idx 
ON vector_store 
USING hnsw (embedding vector_cosine_ops);
```

### 4.2. Knowledge Base Relational Tables
Managed by Flyway (`db/migration`):
```sql
-- Master document table
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    source VARCHAR(255),
    source_type VARCHAR(50),
    language VARCHAR(10) NOT NULL,
    crop VARCHAR(100),
    topic VARCHAR(50),
    authority VARCHAR(100),
    version VARCHAR(50),
    published_date DATE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    source_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chunk child table with relational linkage
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    token_count INT,
    character_count INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_knowledge_chunk_doc_index UNIQUE (document_id, chunk_index)
);
```

---

## 5. API Reference

### Generate Advisory

- **Method**: `POST`
- **Path**: `/api/v1/farms/{farmId}/advisory`
- **Headers**:
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  Content-Type: application/json
  ```

#### Request Payload:
```json
{
  "farmId": "f046e4e2-b421-4db9-9149-0c5fffc50cf0",
  "fieldId": "8f8b0561-9c32-4e89-a20c-7b0a701a5401",
  "question": "My paddy leaves have yellow streaks and brown spots. What disease is this and how can I treat it?"
}
```

#### Successful Response (`200 OK`):
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "answer": "Based on the symptoms described and your active crop (Paddy - IR20 in Tillering stage on Red Loamy Soil), the crop is likely infected with Bacterial Leaf Blight [Source 1].\n\nRecommended Actions:\n1. Drain excess standing water from the field for 24-48 hours.\n2. Apply Copper Hydroxide 77% WP @ 2g per liter or Streptomycin Sulphate + Tetracycline Combination @ 300g/acre.\n3. Note: Your farm inventory currently has 5 kg of Copper Hydroxide in Storage Location B.\n4. Avoid excess Nitrogen application until new tillers emerge.",
    "sources": [
      {
        "documentTitle": "TNAU Crop Protection Guide - Paddy Diseases",
        "category": "DISEASE_MANAGEMENT",
        "relevanceScore": 0.88,
        "authority": "Tamil Nadu Agricultural University"
      }
    ],
    "weatherUsed": true
  },
  "timestamp": "2026-09-27T13:20:00Z"
}
```

---

## 6. Frontend Integration

- **Component**: `frontend/src/features/advisory/components/AdvisoryWidget.tsx`
- **Features**:
  - Embedded AI assistant chat drawer accessible across all farm views.
  - Automatically attaches the currently selected `farmId` and active `fieldId`.
  - Supports bilingual input in English and Tamil (தமிழ்).
  - Displays interactive source citation badges linking back to verified agricultural documents.
  - In-memory and IndexedDB caching for offline advisory history via TanStack Query and Dexie.js.

---

## 7. Configuration Reference

| Property Key | Default Value | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | *(Environment Variable)* | API Key for Google Gemini API authentication. |
| `smartfarm.ai.llm.model` | `gemini-3.6-flash` | Gemini model name used for advisory generation. |
| `smartfarm.ai.llm.temperature` | `0.2` | Controls randomness (low value ensures high factual consistency). |
| `smartfarm.ai.llm.enabled` | `true` | Feature flag to enable/disable AI advisory orchestration. |
| `smartfarm.knowledge.ingestion.chunk-size` | `1000` | Target character length per document chunk. |
| `smartfarm.knowledge.ingestion.chunk-overlap` | `150` | Character overlap between consecutive chunks. |
| `smartfarm.knowledge.retrieval.max-distance` | `0.50` | Maximum cosine distance threshold for vector search. |
| `spring.ai.vectorstore.pgvector.dimensions` | `384` | Vector dimensionality (must match `all-MiniLM-L6-v2`). |
| `spring.ai.vectorstore.pgvector.table-name` | `vector_store` | PostgreSQL table name storing embeddings. |
| `spring.ai.vectorstore.pgvector.distance-type` | `COSINE_DISTANCE`| Vector distance metric for similarity ranking. |
| `spring.ai.vectorstore.pgvector.index-type` | `HNSW` | PostgreSQL vector index type. |
