# PHASE 2.6 — KNOWLEDGE MANAGEMENT & LIFECYCLE REPORT

## 1. Initial Audit

Before introducing changes, an audit of the existing knowledge infrastructure was conducted:

| Component | Class / Location | State & Capability |
|---|---|---|
| **Domain Model** | `KnowledgeDocument`, `KnowledgeChunk` | Global entity models without `farm_id`. `KnowledgeDocument` holds metadata, storage paths, status (`DRAFT`, `ACTIVE`, `ARCHIVED`). `KnowledgeChunk` holds text and metadata references. |
| **Storage Layer** | `DocumentStorageService` | MinIO binary storage under `knowledge/{documentId}/{safeFilename}`. Provides `storeDocument`, `documentExists`, `getDocumentBytes`, `deleteDocument`. |
| **Ingestion Pipeline** | `DocumentIngestionOrchestrator`, `KnowledgeIngestionService` | Apache Tika text extraction, `TextNormalizer`, `DeterministicChunker`, persistence to PostgreSQL, embedding via `all-MiniLM-L6-v2` (384-d), vector storage in PgVector `vector_store`. |
| **Retrieval Engine** | `KnowledgeRetrievalService` | Queries `vector_store` using cosine distance with Spring AI filter expression: `b.eq("status", "ACTIVE")`. Top-K semantic search with similarity thresholding. |
| **Database & Schema** | PostgreSQL + PgVector (`vector_store` HNSW index) | Flyway V19 (`vector_store` table, `knowledge_documents`, `knowledge_chunks`), V20 (storage metadata columns). Schema completely supports lifecycle without any new migration. |
| **Security Layer** | Spring Security 6 + `TokenProvider` + `JwtAuthenticationFilter` | Stateless JWT authentication, role extraction into `ROLE_<ROLE>`. Admin operations gated via `@PreAuthorize("hasRole('ADMIN')")`. |

**Audit Conclusion**: The existing architecture is sound, modular, and fully capable of supporting the lifecycle management and health diagnostics without schema migrations or pipeline redesign.

---

## 2. Existing Functionality Reused

- **PostgreSQL Database & PgVectorStore**: Reused table `knowledge_documents`, `knowledge_chunks`, and `vector_store` (384-dimensional HNSW cosine index).
- **MinIO Binary Storage**: Reused `DocumentStorageService` for verifying physical object existence and key sanitization.
- **RAG Semantic Search**: Reused `KnowledgeRetrievalService` which already enforces `b.eq("status", "ACTIVE")`.
- **JWT Authentication & Authorization**: Reused `TokenProvider` and `JwtAuthenticationFilter` without modifying the core authentication model.
- **Spring AI Vector Synchronization**: Reused vector metadata JSON format (`status`, `title`, `crop`, `topic`, `knowledgeDocumentId`, `knowledgeChunkId`).

---

## 3. Files Created

1. `backend/src/main/java/com/smartfarm/features/knowledge/dto/KnowledgeDocumentFilter.java`: Dynamic filtering criteria (title, source, sourceType, authority, language, crop, topic, status, version, free-text query).
2. `backend/src/main/java/com/smartfarm/features/knowledge/dto/KnowledgeDocumentSummaryDto.java`: Compact document representation with chunk count.
3. `backend/src/main/java/com/smartfarm/features/knowledge/dto/KnowledgeDocumentDetailDto.java`: Complete document inspection DTO exposing storage presence, vector count, and metadata.
4. `backend/src/main/java/com/smartfarm/features/knowledge/dto/KnowledgeHealthReportDto.java`: Diagnostic health report DTO reporting repository integrity, discrepancy counts, and offending IDs.
5. `backend/src/main/java/com/smartfarm/features/knowledge/exception/KnowledgeLifecycleException.java`: Domain exception mapping to HTTP 400 Bad Request for invalid lifecycle transitions and safety violations.
6. `backend/src/main/java/com/smartfarm/features/knowledge/repository/KnowledgeDocumentSpecification.java`: JPA Specification for dynamic query building and filtering.
7. `backend/src/main/java/com/smartfarm/features/knowledge/service/KnowledgeManagementService.java`: Dedicated service for knowledge lifecycle (list, search, get, activate, archive, vector status sync, duplicate/version protection).
8. `backend/src/main/java/com/smartfarm/features/knowledge/service/KnowledgeHealthService.java`: Diagnostic service executing 7 comprehensive integrity checks across PostgreSQL, MinIO, and PgVector.
9. `backend/src/main/java/com/smartfarm/features/knowledge/controller/KnowledgeManagementController.java`: Secured REST controller under `/api/v1/knowledge` protected by `@PreAuthorize("hasRole('ADMIN')")`.
10. `backend/src/test/java/com/smartfarm/features/knowledge/controller/KnowledgeManagementControllerTest.java`: Web layer unit tests for endpoints, filters, error handling, and health reports (8 tests).
11. `backend/src/test/java/com/smartfarm/features/knowledge/service/KnowledgeManagementServiceTest.java`: Service layer unit tests for lifecycle transitions, safety validations, and duplicate protection (13 tests).
12. `backend/src/test/java/com/smartfarm/features/knowledge/service/KnowledgeHealthServiceTest.java`: Diagnostic health service unit tests covering healthy state and each defect detection branch (7 tests).
13. `backend/src/test/java/com/smartfarm/features/knowledge/KnowledgeLifecycleIntegrationTest.java`: End-to-end integration test validating security, lifecycle gating, RAG inclusion/exclusion, and health reporting (6 tests).
14. `backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`: Configuration for Mockito `mock-maker-subclass` to support Java 24 test environments.

---

## 4. Files Modified

1. `backend/src/main/java/com/smartfarm/features/knowledge/repository/KnowledgeDocumentRepository.java`: Added `countByStatus(DocumentStatus status)` and JPA Specification support.
2. `backend/src/main/java/com/smartfarm/features/knowledge/repository/KnowledgeChunkRepository.java`: Added `countByDocument_Id(UUID documentId)`.

---

## 5. API Endpoints

All endpoints are rooted at `/api/v1/knowledge` and secured with `@PreAuthorize("hasRole('ADMIN')")`.

| HTTP Method | Path | Description | Access Control |
|---|---|---|---|
| `GET` | `/api/v1/knowledge` | Paginated listing of documents with structured filters (`source`, `status`, `crop`, `topic`, `language`, `sourceType`, `version`) | `ROLE_ADMIN` |
| `GET` | `/api/v1/knowledge/{id}` | Detailed document metadata, chunk count, vector count, and MinIO storage presence | `ROLE_ADMIN` |
| `GET` | `/api/v1/knowledge/search` | Full-text and structured search across document title, source, authority, and crop | `ROLE_ADMIN` |
| `POST` | `/api/v1/knowledge/{id}/activate` | Safely activates a `DRAFT` document after passing 5 pre-activation safety checks | `ROLE_ADMIN` |
| `POST` | `/api/v1/knowledge/{id}/archive` | Archives an `ACTIVE` document, excluding it from RAG while preserving all data | `ROLE_ADMIN` |
| `POST` | `/api/v1/knowledge/{id}/index` | Synchronizes vector embeddings for all document chunks in `vector_store` | `ROLE_ADMIN` |
| `GET` | `/api/v1/knowledge/health` | Comprehensive diagnostic health report of the agricultural knowledge repository | `ROLE_ADMIN` |

---

## 6. Lifecycle Rules

1. **DRAFT**:
   - Persisted in PostgreSQL (`knowledge_documents`).
   - Original file may exist in MinIO.
   - Chunks may exist in `knowledge_chunks`.
   - Any corresponding vectors in `vector_store` have `metadata->>'status' = 'DRAFT'`.
   - **RAG Rule**: Excluded from retrieval (`status == 'ACTIVE'` filter in `KnowledgeRetrievalService`).
2. **ACTIVE**:
   - Eligible for participation in RAG retrieval.
   - Corresponding vector records in `vector_store` have `metadata->>'status' = 'ACTIVE'`.
   - Must have passed all 5 activation safety checks.
3. **ARCHIVED**:
   - Retained for provenance, historical lineage, and traceability.
   - Corresponding vector records in `vector_store` have `metadata->>'status' = 'ARCHIVED'`.
   - **RAG Rule**: Excluded from retrieval.
   - **Preservation Rule**: Original MinIO object, PostgreSQL chunks, and vector store rows are NEVER deleted.

---

## 7. Security Rules

- **Zero Tenant Leakage**: The knowledge base is global authoritative agricultural knowledge. No `farm_id` is introduced into documents, chunks, or vectors.
- **Administrative Restriction**: Knowledge management endpoints (`/api/v1/knowledge/**`) require `ROLE_ADMIN`.
- **Worker / Farmer Isolation**: Workers (`ROLE_WORKER`) and Farm Owners (`ROLE_FARM_OWNER`) receiving JWT tokens receive `403 Forbidden` if attempting to access `/api/v1/knowledge/**`.
- **Unauthenticated Access**: Requests without valid JWT receive `401 Unauthorized`.
- **Public Surface**: No public unauthenticated endpoints exposed.

---

## 8. Knowledge Health Checks

The diagnostic `KnowledgeHealthService` performs 7 non-destructive diagnostic integrity checks:

1. **Active Documents Without Chunks**: Flags `ACTIVE` documents with `chunkCount == 0`.
2. **Chunks Without Vectors**: Flags chunk IDs in `knowledge_chunks` that lack a row in `vector_store`.
3. **Orphan Vectors**: Flags vector IDs in `vector_store` that have no corresponding row in `knowledge_chunks`.
4. **Missing MinIO Files**: Verifies physical existence in MinIO bucket for every document with a `storage_path`.
5. **Invalid Indexing State**: Flags `ACTIVE` documents where chunk count does not match vector count in `vector_store`.
6. **Duplicate Document Identities**: Detects duplicate tuples of `(title, version, source)`.
7. **Invalid Metadata**: Flags documents with blank title, null status, or missing essential attributes.

---

## 9. Tests Added

A total of **34 new tests** were added specifically for Phase 2.6:

1. **`KnowledgeManagementControllerTest`** (8 unit tests):
   - `listDocuments_ReturnsPagedSummaries`
   - `getDocumentDetail_Success`
   - `getDocumentDetail_NotFound`
   - `searchDocuments_ReturnsMatches`
   - `activateDocument_Success`
   - `activateDocument_SafetyFailure_Returns400`
   - `archiveDocument_Success`
   - `getHealthReport_Success`
2. **`KnowledgeManagementServiceTest`** (13 unit tests):
   - `testListDocuments`
   - `testGetDocumentDetails`
   - `testGetDocumentDetails_NotFound`
   - `testActivateDocument_Success`
   - `testActivateDocument_AlreadyActive`
   - `testActivateDocument_MissingTitle`
   - `testActivateDocument_MissingStorageFile`
   - `testActivateDocument_ZeroChunks`
   - `testActivateDocument_MissingVectors`
   - `testArchiveDocument_Success`
   - `testArchiveDocument_DraftInvalidTransition`
   - `testFindDuplicateIdentity_Match`
   - `testFindDuplicateIdentity_DifferentVersionPreserved`
3. **`KnowledgeHealthServiceTest`** (7 unit tests):
   - `testHealthyRepository`
   - `testDetectActiveDocWithZeroChunks`
   - `testDetectChunksWithoutVectors`
   - `testDetectOrphanVectors`
   - `testDetectMissingStorageFile`
   - `testDetectInvalidIndexingState`
   - `testDetectInvalidMetadata`
4. **`KnowledgeLifecycleIntegrationTest`** (6 integration tests):
   - `testSecurity_Unauthenticated` (401)
   - `testSecurity_NonAdminForbidden` (403)
   - `testListDocuments_AdminSuccess` (200)
   - `testKnowledgeHealthReport` (diagnostic execution)
   - `testFilterDocuments` (structured filtering)
   - `testCompleteLifecycleAndRagCompatibility` (end-to-end lifecycle, activation safety rejection, DRAFT exclusion, ACTIVE inclusion, ARCHIVED exclusion, archive preservation)

---

## 10. Full Test Results

Execution command:
```powershell
& "C:\apache-maven-3.9.16\bin\mvn.cmd" test
```

### Maven Build Summary:
- **Total Tests Run**: 232
- **Passed**: 232
- **Failures**: 0
- **Errors**: 0
- **Skipped**: 0
- **Build Status**: `BUILD SUCCESS`
- **Execution Time**: 1 min 13 sec

All existing test suites (advisory orchestration, security, RAG evaluation, field code generation, farm service, auth, ingestion, deterministic chunker, text normalizer, MinIO storage) passed without modification.

---

## 11. Database Changes

- **Migrations Added**: **None required**.
- **Schema Compatibility Verification**:
  Existing table structures (`knowledge_documents`, `knowledge_chunks`, and `vector_store`) created in Flyway migrations V19 and V20 already contain all necessary columns (`status`, `storage_path`, `original_filename`, `content_type`, `file_size_bytes`, `metadata`).
  No schema alterations were performed.

---

## 12. RAG Compatibility Verification

Verified live against PostgreSQL and PgVector via `KnowledgeLifecycleIntegrationTest`:

1. **DRAFT Exclusion**:
   A test document with content `"LifecycleTest content: Recommended seed rate for blackgram is 20 kg per hectare."` in `DRAFT` status was queried via `KnowledgeRetrievalService.search(...)`. The search returned 0 matches for this document, verifying that `DRAFT` documents never participate in RAG retrieval.
2. **ACTIVE Inclusion**:
   Upon executing `activateDocument`, vector status was updated to `ACTIVE`. The exact same retrieval query returned the document chunk as a relevant result, verifying active RAG participation.
3. **ARCHIVED Exclusion**:
   Upon executing `archiveDocument`, vector status was updated to `ARCHIVED`. The exact same retrieval query excluded the document chunk, verifying that archived knowledge is immediately and safely gated from AI advisories.
4. **Preservation**:
   PostgreSQL document row, chunk rows, `vector_store` rows, and MinIO binary objects remained completely intact after archiving.

---

## 13. Final Knowledge Counts

Verified directly against PostgreSQL (`smartfarm` database) and live MinIO storage:

| Metric | Verified Value |
|---|---|
| **Active Documents** | **5** |
| **Draft Documents** | **0** |
| **Archived Documents** | **0** |
| **Total Documents** | **5** |
| **Total Knowledge Chunks** | **5,291** |
| **Total Vectors (`vector_store`)** | **5,291** |
| **Missing Vectors** | **0** |
| **Orphan Vectors** | **0** |
| **MinIO Storage Integrity** | **5 / 5 objects verified present** |
| **Repository Health Status** | **HEALTHY** (`healthy: true`) |

The 5 authoritative active documents:
1. `ICAR Kharif Agro-Advisory 2025 for Farmers (Regional Languages Edition)` (ICAR, Multilingual)
2. `Crop Production - Pulses: Blackgram (Vigna mungo L.)` (TNAU, English)
3. `Crop Production Guide 2012` (Govt. of Tamil Nadu & TNAU, English)
4. `Length of Growing Period based Cropping Pattern for different Agro-ecological Zones of Tamil Nadu` (TNAU, English)
5. `ICAR Kharif Agro-Advisories for Farmers 2025 (English Edition)` (ICAR, English)

---

## 14. Known Limitations

- Vector status updates use SQL `jsonb_set` on `metadata` in table `vector_store`. If an alternative vector store implementation without JSONB metadata is adopted in the future, an abstraction over vector status update would be necessary.
- Document versions are validated by exact string equality. Semantic version comparison (e.g. `2.0` > `1.9`) is not currently evaluated.
- Document indexing (`POST /api/v1/knowledge/{id}/index`) is synchronous. For very large documents (>10,000 chunks), asynchronous background processing with job status tracking would be beneficial.

---

## 15. Recommended Next Phase

### Phase 2.7 — Knowledge Ingestion & Admin Operations
- Create an asynchronous background ingestion queue for administrator document uploads.
- Add an administrator UI for monitoring ingestion progress, chunk inspection, and health dashboards.
- Provide document replacement/version deprecation workflows with automatic archiving of superseded versions.
