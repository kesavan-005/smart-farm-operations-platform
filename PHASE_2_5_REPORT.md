# Phase 2.5 — Real Agricultural Knowledge Acquisition & RAG Validation Report

**Project**: Uzhavan Smart Farm Operations Platform (RAG)  
**Backend**: `C:\Users\Dell\Desktop\smart-farm-operations-platform-RAG\backend`  
**Date**: September 27, 2026  
**Status**: COMPLETE (Infrastructure, Pipeline, Persistence & Grounding Validated; Real Production Knowledge Seeding Pending Real Authoritative Document Intake)

---

## 1. Executive Summary

Phase 2.5 audited and validated the end-to-end persistent RAG ingestion and retrieval architecture built across Phases 2.1 through 2.4. In strict compliance with the **Real Document Policy**, zero synthetic or fabricated agricultural documents were generated. 

A thorough repository and filesystem scan confirmed:  
**REAL AGRICULTURAL DOCUMENTS WERE NOT AVAILABLE FOR INGESTION.**

Consequently, all validation was conducted strictly on infrastructure integrity, ingestion mechanics, object and relational persistence, vector math, and LLM grounding behavior using clean, neutral test fixtures.

### Readiness Status Breakdown
- **PASS** — Infrastructure (PostgreSQL, PgVector HNSW, MinIO S3 object storage)
- **PASS** — Ingestion Mechanics (`KnowledgeSeedService`, `DocumentIngestionOrchestrator`, `DocumentTextExtractor`, `KnowledgeIngestionService`)
- **PASS** — Persistence (`knowledge_documents`, `knowledge_chunks`, MinIO binaries)
- **PASS** — Vector Pipeline (in-process `all-MiniLM-L6-v2` 384-d embeddings, `vector_store` table)
- **PASS** — LLM Grounding & Provenance Attribution (Google Gemini `gemini-3.6-flash` live execution)
- **PENDING** — Real Agricultural Knowledge (Awaiting real TNAU / ICAR / KVK publications from project stakeholders)
- **PENDING** — Real Source-Grounded Advisory Validation (Awaiting real domain-specific agricultural document ingestion)

---

## 2. Phase 2.4 Audit

The implementation created in Phase 2.4 was audited:

1. **Seed Directory Structure**:
   `backend/src/main/resources/knowledge-seed/` contains isolated institutional directories:
   - `tnau/` (Tamil Nadu Agricultural University)
   - `icar/` (Indian Council of Agricultural Research)
   - `kvk/` (Krishi Vigyan Kendra)
   - `government/` (Department of Agriculture / Government Ministries)
   - `manifest.json` (active manifest descriptor)
   - `README.md` (authoritative schema and ingestion guide)

2. **Core Components**:
   - `KnowledgeSeedProperties`: Property binding (`smartfarm.knowledge.seed.enabled`, `location`, `manifest-file`). Default is `enabled: false`.
   - `KnowledgeSeedRunner`: `@ConditionalOnProperty(prefix = "smartfarm.knowledge.seed", name = "enabled", havingValue = "true")`. Ensures no unprompted seeding occurs during local startup.
   - `KnowledgeSeedService`: Discovers manifests, parses JSON via Jackson, validates required metadata, checks database existence to enforce idempotency, and delegates to `DocumentIngestionOrchestrator`.
   - `DocumentIngestionOrchestrator`: Bridges MinIO streaming, Apache Tika extraction, and `KnowledgeIngestionService`.

3. **Status & Scoping Rules**:
   - Seed documents default to `ACTIVE` (eligible for RAG).
   - `DRAFT` status prevents vector insertion into PgVector.
   - `ARCHIVED` status prevents retrieval in `KnowledgeRetrievalService`.
   - All knowledge documents are global platform knowledge (`farm_id` does not exist on `KnowledgeDocument`).

---

## 3. Real Document Availability

A workspace-wide scan for agricultural publications (`.pdf`, `.docx`, `.txt`) was executed:
- Scan Scope: Entire workspace root excluding `node_modules`, `.git`, and `target`.
- Findings: **0 real agricultural publications found.**
- **Policy Enforcement**: Per Step 2 instructions, no fake agricultural PDFs or fabricated TNAU/ICAR crop recommendations were manufactured.
- Production `manifest.json` correctly remains initialized with `{"documents": []}`.

---

## 4. Documents Actually Ingested

- **Production Documents Ingested**: 0 (no real documents present).
- **Test Ingestion & Regression Documents**: Verified through automated integration test suites (`KnowledgeSeedIntegrationTest`, `Phase25RagValidationAndSafetyTest`, `DocumentExtractionIngestionIntegrationTest`):
  - Neutral test document: `tnau/neutral-crop-guide.txt`
  - Ingestion outcome: `SUCCESS` on first run, `SKIPPED_DUPLICATE` on second run.
  - Chunks created: 1
  - Vectors inserted: 1 (for ACTIVE status)

---

## 5. Source Provenance

Every ingested chunk and subsequent search result is strictly traceable back to its originating `KnowledgeDocument` record:

| Field | Source in PostgreSQL | Provenance in PgVector Metadata | In Advisory Response |
| :--- | :--- | :--- | :--- |
| `knowledgeDocumentId` | `knowledge_documents.id` | `metadata->>'knowledgeDocumentId'` | `sources[i].knowledgeDocumentId` |
| `knowledgeChunkId` | `knowledge_chunks.id` | `vector_store.id` | `sources[i].knowledgeChunkId` |
| `chunkIndex` | `knowledge_chunks.chunk_index`| `metadata->>'chunkIndex'` | `sources[i].chunkIndex` |
| `title` | `knowledge_documents.title` | `metadata->>'title'` | `sources[i].title` |
| `source` | `knowledge_documents.source` | `metadata->>'source'` | `sources[i].source` |
| `sourceType` | `knowledge_documents.source_type` | `metadata->>'sourceType'` | `sources[i].sourceType` |
| `authority` | `knowledge_documents.authority` | `metadata->>'authority'` | `sources[i].authority` |
| `version` | `knowledge_documents.version` | `metadata->>'version'` | `sources[i].version` |
| `publishedDate` | `knowledge_documents.published_date`| `metadata->>'publishedDate'` | `sources[i].publishedDate` |
| `lastVerifiedAt` | `knowledge_documents.last_verified_at`| `metadata->>'lastVerifiedAt'` | `sources[i].lastVerifiedAt` |
| `storagePath` | `knowledge_documents.storage_path` | Verified in MinIO | Traceable to original binary |

---

## 6. MinIO Verification

- **Service**: Docker container `smartfarm-minio` on `localhost:9000`.
- **Bucket**: `smartfarm-knowledge` (verified present via MinIO Client `mc ls local`).
- **Storage Pattern**: `knowledge/{documentId}/{sanitizedFilename}`.
- **Verification**:
  - `DocumentStorageService.storeDocument(...)` creates objects with proper content-type.
  - Streaming retrieval via `getDocumentStream(...)` feeds Apache Tika without intermediate disk files.
  - Path traversal defense (`sanitizeFilename(...)`) neutralizes attempts at directory breakout.

---

## 7. PostgreSQL Verification

Database queried directly via `psql` against `smartfarm-postgres`:
- `knowledge_documents` table: Preserves metadata, Flyway V20 columns (`original_filename`, `content_type`, `file_size_bytes`, `storage_path`).
- `knowledge_chunks` table: Preserves relational mapping (`document_id`, `chunk_index`, `content`, `metadata`).
- Foreign key constraints: Cascading deletes ensure no orphaned chunks remain when documents are removed.
- Fix verified in Phase 2.5: `KnowledgeIngestionService.deleteDocumentAndVectors` was updated to delete vectors by chunk IDs from `vector_store`, preventing orphaned vector entries.

---

## 8. PgVector Verification

Direct database verification:
```sql
SELECT column_name, data_type, udt_name FROM information_schema.columns 
WHERE table_name = 'vector_store' AND column_name = 'embedding';
-- Result: embedding | USER-DEFINED | vector

SELECT attname, atttypmod AS dimensions FROM pg_attribute 
WHERE attrelid = 'vector_store'::regclass AND attname = 'embedding';
-- Result: embedding | 384

SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'vector_store';
-- Result: spring_ai_vector_index | CREATE INDEX spring_ai_vector_index ON public.vector_store USING hnsw (embedding vector_cosine_ops)
```
- Embedding dimension: **Exactly 384**.
- Distance operator: Cosine distance (`vector_cosine_ops`).
- Index algorithm: **HNSW**.

---

## 9. Chunking Verification

- Managed by `DeterministicChunker` and `KnowledgeIngestionProperties`.
- Default chunk size: **1000 characters**.
- Default overlap: **150 characters**.
- Natural boundary preservation: Chunks split on paragraph or sentence boundaries without clipping words mid-character.

---

## 10. Embedding Verification

- Managed by in-process `TransformersEmbeddingModel` initialized in `AIProviderConfig`.
- ONNX model: `all-MiniLM-L6-v2`.
- Vector dimension: **384** float values.
- Consistency: 100% consistent across dev, test, and prod profiles. No external OpenAI embedding dependencies or API keys required.

---

## 11. Retrieval Tests

Retriever behavior verified in `KnowledgeRetrievalServiceTest`, `KnowledgeRetrievalIntegrationTest`, and `Phase25RagValidationAndSafetyTest`:
- **Active documents**: Searchable and retrieved when cosine distance $\le 0.50$.
- **Draft documents**: Excluded from retrieval (`status = DRAFT` never enters PgVector).
- **Archived documents**: Excluded from retrieval (`FilterExpressionBuilder.Op op = b.eq("status", "ACTIVE")` always enforced).
- **Metadata filters**: Matching crop (`crop = 'Paddy'`), topic (`topic = 'SOIL'`), and language (`language = 'ENGLISH'`) work properly.
- **TopK**: Requested `topK` is bounded and respected.
- **No matching knowledge**: Queries with distance $> 0.50$ (or unmapped topics) return empty list cleanly.

---

## 12. Gemini Grounding Tests

Live runtime testing executed via `POST /api/v1/farms/30444884-e5d3-4114-8604-e1dcd8a5d1f3/advisory`:
- **Model**: `gemini-3.6-flash` via OpenAI compatibility layer.
- **Context Injection**:
  - Live farm state (North Field Paddy CO 51, South Field Turmeric CO 2, Flowering stage).
  - Live weather forecast (Open-Meteo, 35.6°C, light rain expected next 6 days).
  - Retrieved agricultural knowledge (Attached as `[Source 1]`).
- **Grounding Fidelity**:
  - Because the retrieved knowledge did not contain pest treatment details, Gemini stated:
    > *"Please note that the available agricultural reference database currently lacks specific technical guidelines and pest/disease management protocols for Paddy and Turmeric during their flowering stage under rainy conditions [Source 1]. For specific fertilizer dosage or plant protection chemical advice, please consult your local agricultural extension office or authorized university advisory."*
  - **Zero hallucinated sources**: Gemini did NOT invent citations or fabricate chemical formulas.

---

## 13. Source Attribution Tests

- The API response contains structured metadata array `data.sources`:
  ```json
  {
    "knowledgeDocumentId": "6c7d2ce0-6425-4526-90af-e1ecce770e35",
    "knowledgeChunkId": "b101ba04-b508-4f53-bd5a-4d7e001b2ca5",
    "chunkIndex": 0,
    "title": "Test Agricultural Guidance 2026",
    "source": "Tamil Nadu Agricultural University",
    "sourceType": "AGRICULTURAL_UNIVERSITY",
    "authority": "TNAU Directorate",
    "version": "2026.1",
    "publishedDate": "2026-01-15",
    "score": 0.5124864876270294
  }
  ```
- All attribution is deterministic and derived from database records, not LLM guesses.

---

## 14. Negative Tests

Automated in `Phase25RagValidationAndSafetyTest` and `KnowledgeSeedServiceTest`:
1. **Nonexistent seed file**: Caught, logged, marked as failed with clear message.
2. **Unsupported extension** (`.exe`, `.bin`): Rejected immediately before storage.
3. **Corrupt document**: Apache Tika exception caught, logged, reported in failure details.
4. **Empty document** (0 bytes): Rejected with validation error.
5. **Duplicate document** (matching title, version, source): Skipped without duplicate MinIO uploads or PgVector writes.
6. **DRAFT document**: Stored in relational DB, excluded from PgVector.
7. **ARCHIVED document**: Excluded from retrieval filter.
8. **Missing optional metadata** (null `sourceUrl`, `authority`, `version`, `crop`): Handled without null pointer exceptions.
9. **Unrelated query**: Returns empty knowledge list; LLM acknowledges absence of knowledge.

---

## 15. Global Knowledge Isolation

- `KnowledgeDocument` entities contain no `farm_id`.
- Knowledge is global and shared among all authorized users of the advisory system.
- Live queries for Farm A and Farm B both successfully retrieve global knowledge.
- Live farm context (farm fields, private activities, financial transactions) is injected strictly into the ephemeral prompt `<FARM_CONTEXT>` and is never saved into `knowledge_documents` or `vector_store`.

---

## 16. Test Results

### Full Maven Regression
Command:
```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'; $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"; C:\apache-maven-3.9.16\bin\mvn.cmd test
```

**Results**:
- **Tests run**: **192**
- **Failures**: **0**
- **Errors**: **0**
- **Skipped**: **0**
- **Build Status**: **BUILD SUCCESS**

---

## 17. Known Limitations

1. **Scanned / Image-only Documents**: Apache Tika extracts text from text-based PDFs and DOCX files. Image-only or scanned PDFs without embedded text layers produce an empty extraction error and fail fast rather than inserting blank knowledge. OCR is scheduled for a future phase.
2. **Awaiting Real Publications**: Until authorized stakeholders supply real PDF manuals from TNAU, ICAR, or KVK, the production seed directory contains empty directory trees.

---

## 18. Remaining Work

1. Place real authoritative PDFs into `backend/src/main/resources/knowledge-seed/` (`tnau/`, `icar/`, `kvk/`, or `government/`).
2. Populate `manifest.json` with official titles, sources, and dates.
3. Set `smartfarm.knowledge.seed.enabled: true` in deployment environment to execute one-time seed population into MinIO and PgVector.
4. Phase 2.6 / 3.0: Implement Admin Document Management REST API & Upload UI.
