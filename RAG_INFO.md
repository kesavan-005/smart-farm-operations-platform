# RAG (Retrieval-Augmented Generation) Architecture & Specification
## Project Uzhavan — Smart Farm Operations Platform

---

## Executive Summary

This document provides a complete audit, architecture design, and technical specification for **Retrieval-Augmented Generation (RAG)** within the **Smart Farm Operations Platform (Project Uzhavan)**. 

---

## 1. Project Audit: Current RAG Status

### Current Architecture Summary
- **Backend Stack**: Java 17, Spring Boot 3.3.0, Spring Security (JWT), PostgreSQL + PostGIS (Hibernate Spatial), Redis 7, Flyway.
- **Frontend Stack**: React 19, Vite PWA, TailwindCSS, TypeScript, Zustand, TanStack Query, Dexie.js (IndexedDB).
- **Localization**: Bilingual (English ↔ Tamil) offline-first UI via `i18next`.
- **Integrations**: Open-Meteo REST API for localized 7-day farm weather forecasts.

### Current RAG Implementation Audit
- **Status**: **Not Yet Implemented** in the codebase repository.
- **Active Data Store**: PostgreSQL 16 with PostGIS spatial extensions for geo-polygons (`farms`, `fields`).
- **Dependencies**: No current vector database (`pgvector`, Qdrant, Chroma) or LLM framework (`Spring AI`, `LangChain4j`) in `pom.xml`.

---

## 2. Target Use Cases for RAG in Smart Farming

Integrating RAG into Project Uzhavan provides specialized AI agronomy intelligence tailored to Indian/Tamil Nadu agriculture:

```
[ Farmer Query ] (Tamil / English)
       │
       ▼
[ Query Embedding ] ──► [ Hybrid Vector Search (pgvector) ] ◄── [ Agricultural Knowledge Base ]
       │                                                                  (TNAU, KVK, ICAR Data)
       ▼
[ Context Retrieval ] + [ Live Farm State (Soil pH, Weather, Crop Stage, Inventory) ]
       │
       ▼
[ LLM Generation (Spring AI / Gemini / OpenAI) ]
       │
       ▼
[ Grounded Agronomy Advisory Response ] (Bilingual English ↔ Tamil)
```

### Key RAG Features:
1. **Multilingual Agronomy Advisory (Tamil & English)**
   - Context-aware advisory for regional crops (*Paddy/Nel, Sugarcane/Kumbu, Coconut/Thennai, Banana/Vazhai, Cotton/Paruthi*).
   - Natural language queries in Tamil script, transliterated Tamil (Tanglish), or English.
2. **Context-Aware Farm Integration**
   - RAG pipeline injects real-time operational context into the prompt:
     - Selected Farm's Soil Type & pH (`farm.soilType`, `farm.soilPh`).
     - Live Weather Alert & Rainfall (`currentWeather.temperature`, `alerts`).
     - Active Crop Stage & Sowing Date (`crop.sowingDate`, `crop.season`).
     - Available On-Farm Inventory (`inventoryItem.currentQuantity`).
3. **Pest & Disease Treatment Lookup**
   - Retrieves verified organic and chemical treatment guidelines from agricultural extension databases (TNAU Agri Portal, ICAR, KVK handbooks).
4. **Government Subsidy & Scheme Guidance**
   - Answers questions regarding Tamil Nadu state agricultural subsidies, PM-KISAN, micro-irrigation schemes, and crop insurance claims.

---

## 3. Recommended Technical Stack & Infrastructure

To keep the platform lean and avoid extra infrastructure overhead:

| Component | Technology | Rationale |
|---|---|---|
| **Vector Database** | `pgvector` Extension (PostgreSQL) | Native PostgreSQL vector similarity search; no additional service needed alongside existing PostGIS database. |
| **Embeddings Model** | `bge-m3` or `text-embedding-3-small` / Google Vertex AI Embeddings | Superior cross-lingual performance for English and Tamil semantic retrieval. |
| **Backend AI Framework** | `Spring AI` or `LangChain4j` | Native Spring Boot 3 integration with standard repositories and `@Bean` configurations. |
| **LLM Provider** | Google Gemini 1.5 Flash / OpenAI GPT-4o-mini | Fast inference, cost-effective, high multilingual accuracy in Tamil. |
| **Offline Cache** | Dexie.js (IndexedDB) + Redis | Pre-caches frequent advisory topics offline for instant PWA loading. |

---

## 4. Database Schema (PostgreSQL DDL)

To add RAG capabilities, execute the following Flyway migration (`V2__add_rag_vector_search.sql`):

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Table 1: Knowledge Base Documents
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    title_ta VARCHAR(255),
    category VARCHAR(100) NOT NULL, -- 'CROP_DISEASE', 'SOIL_MANAGEMENT', 'PEST_CONTROL', 'SCHEMES'
    source_url TEXT,
    author VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: Document Chunks & Vector Embeddings
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    content_ta TEXT,
    metadata JSONB DEFAULT '{}'::jsonb, -- Crop type, growth stage, soil suitability
    embedding vector(1536), -- Dimension matching embedding model (e.g. OpenAI text-embedding-3-small)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- HNSW Vector Index for fast cosine similarity lookup
CREATE INDEX idx_knowledge_chunks_embedding 
ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for Metadata Filtering
CREATE INDEX idx_knowledge_chunks_metadata ON knowledge_chunks USING gin (metadata);
```

---

## 5. API Contracts & Specifications

### 1. Submit Advisory Query
- **Endpoint**: `POST /api/v1/advisory/query`
- **Headers**: `Authorization: Bearer <JWT>`
- **Request Body**:
```json
{
  "farmId": "8bc2ee61-0a25-4c73-bd2d-64ff07dfbe9f",
  "cropId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "language": "ta",
  "query": "நெல் பயிரில் இலை சுருட்டு புழுவை எவ்வாறு கட்டுப்படுத்துவது?"
}
```

- **Response Body**:
```json
{
  "success": true,
  "data": {
    "queryId": "e1234567-e89b-12d3-a456-426614174000",
    "language": "ta",
    "answer": "உங்கள் பண்ணையின் தற்போதைய நிலவரப்படி (மண்: களிமண், வானிலை: மழை சாத்தியக்கூறு 0%), நெல் பயிரில் இலை சுருட்டு புழுவை கட்டுப்படுத்த கீழ்க்கண்ட முறைகளை பின்பற்றலாம்:\n1. கார்டாப் ஹைட்ரோகுளோரைடு (Cartap Hydrochloride) 4G - ஏக்கருக்கு 7-8 கிலோ பயன்படுத்தவும்.\n2. அல்லது வேப்ப எண்ணெய் 3% கரைசலை தெளிக்கவும்.\n3. உங்கள் பண்ணை சரக்கிருப்பில் (Inventory) வேப்ப எண்ணெய் உள்ளது.",
    "sources": [
      {
        "documentTitle": "TNAU Agronomy Guide - Pest Management in Paddy",
        "category": "PEST_CONTROL",
        "relevanceScore": 0.89
      }
    ],
    "farmContextApplied": {
      "soilType": "Clay",
      "temperature": 32.5,
      "cropName": "Paddy (Nel)",
      "growthStage": "Vegetative"
    },
    "timestamp": "2026-09-08T16:43:00Z"
  }
}
```

---

## 6. Implementation Roadmap

### Phase 1: Knowledge Base Preparation
1. Aggregate extension guides from TNAU (Tamil Nadu Agricultural University) & ICAR.
2. Structure documents into markdown/JSON format categorized by crop, disease, pest, and soil management.

### Phase 2: Backend Integration
1. Add `Spring AI` (`spring-ai-pgvector-store-starter` & `spring-ai-openai-starter` / `gemini-starter`) to `backend/pom.xml`.
2. Implement vector store search service `AgronomyVectorStoreService.java`.
3. Create prompt template engine blending retrieve knowledge + farm state parameters (`FarmService`, `WeatherService`, `CropService`, `InventoryService`).

### Phase 3: Frontend Interface
1. Create `AdvisoryScreen.tsx` component in `frontend/src/features/advisory`.
2. Add voice query input (Web Speech API) for hands-free query entry by farmers.
3. Cache advisory responses in IndexedDB via `Dexie.js` for offline access.

---

*Document generated for Smart Farm Operations Platform (Project Uzhavan).*
