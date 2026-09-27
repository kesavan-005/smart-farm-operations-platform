# PHASE 2.7 — CONTROLLED KNOWLEDGE DOCUMENT INGESTION & MANAGEMENT API REPORT

## 1. Initial Architecture Audit
Prior to implementing Phase 2.7, an audit of the existing backend knowledge infrastructure was performed:
- **`KnowledgeDocument` & `KnowledgeChunk` Entities**: Validated existing database schema and entity relations. Supported metadata fields include `title`, `source`, `sourceType`, `language`, `crop`, `topic`, `authority`, `version`, `publishedDate`, `lastVerifiedAt`, `sourceUrl`, and `status`. Storage attributes from Phase 2.2 include `originalFilename`, `storagePath`, `contentType`, `fileSizeBytes`, `checksumSha256`, and `extractedText`.
- **`DocumentStorageService`**: Robust MinIO object storage service managing uploads (`storeDocument`), retrieval (`getDocumentStream`), and deletion (`deleteDocument`) using isolated UUID storage keys (`knowledge/{documentId}/{safeFilename}`).
- **`DocumentTextExtractor`**: Apache Tika-based text extraction supporting PDF (`application/pdf`), DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`), and TXT (`text/plain`), with size validation and MIME type detection.
- **`DeterministicChunker` & `TextNormalizer`**: Handles text cleaning and token-safe chunking with overlap.
- **`KnowledgeIngestionService`**: Handles persisting chunks and generating 384-dimensional embeddings with `all-MiniLM-L6-v2` into PgVector `vector_store`.
- **`KnowledgeManagementService` & `KnowledgeManagementController`**: Implemented in Phase 2.6 with document search, detail lookup, activation, archiving, and deletion, secured with `@PreAuthorize("hasRole('ADMIN')")`.
- **Integrity Baseline**: Exactly 5 active authoritative agricultural documents, 5,291 chunks, and 5,291 vectors, 0 missing vectors, and 0 orphan vectors.

Integration strategy: Extend the existing `KnowledgeManagementController` and `KnowledgeManagementService` to host the document ingestion API without duplicating any storage, extraction, chunking, or embedding logic.

---

## 2. Existing Services Reused
Phase 2.7 achieved strict adherence to the DRY principle by reusing 100% of the Phase 2.2–2.6 pipeline:
1. **[DocumentStorageService](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/storage/DocumentStorageService.java)**: Stores the raw uploaded file in MinIO and rolls back/deletes if downstream processing fails.
2. **[DocumentTextExtractor](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/extractor/DocumentTextExtractor.java)**: Detects MIME types and extracts raw text via Apache Tika.
3. **[TextNormalizer](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/TextNormalizer.java)**: Cleans whitespace and normalizes text.
4. **[DeterministicChunker](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/DeterministicChunker.java)**: Splits extracted text deterministically into chunks.
5. **[KnowledgeIngestionService](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/service/KnowledgeIngestionService.java)**: Builds Spring AI `Document` vector representations and writes embeddings directly into PgVector.
6. **[KnowledgeRetrievalService](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/service/KnowledgeRetrievalService.java)**: Ensures vector search strictly filters by `status = 'ACTIVE'`, keeping newly uploaded `DRAFT` documents invisible to RAG until explicitly activated.
7. **[KnowledgeManagementService](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/service/KnowledgeManagementService.java)**: Manages lifecycle transitions (`DRAFT` -> `ACTIVE` -> `ARCHIVED`) and synchronizes vector metadata status.

---

## 3. New Files
1. **[KnowledgeDocumentUploadRequest.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/dto/KnowledgeDocumentUploadRequest.java)**: Multipart request DTO containing `file` and metadata fields (`title`, `source`, `sourceType`, `language`, `crop`, `topic`, `authority`, `version`, `publishedDate`, `lastVerifiedAt`, `sourceUrl`, `status`, `metadata`). Does NOT accept `farmId`.
2. **[KnowledgeDocumentUploadResponse.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/dto/KnowledgeDocumentUploadResponse.java)**: Response DTO containing ingested document attributes, chunk count, vector count, storage reference, and ingestion status (`INGESTED`). Sanitized against internal secrets.
3. **[KnowledgeDocumentIngestionIntegrationTest.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/test/java/com/smartfarm/features/knowledge/KnowledgeDocumentIngestionIntegrationTest.java)**: Comprehensive end-to-end integration tests verifying requirements A through T.

---

## 4. Modified Files
1. **[KnowledgeManagementController.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/controller/KnowledgeManagementController.java)**: Added `POST /api/v1/knowledge/documents` consuming `multipart/form-data`, returning HTTP 201 Created on success.
2. **[KnowledgeManagementService.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/features/knowledge/service/KnowledgeManagementService.java)**: Injected `KnowledgeIngestionService`, `DocumentTextExtractor`, `TextNormalizer`, `DeterministicChunker`, and `KnowledgeSeedProperties`. Added `uploadDocument(...)` orchestrating the upload, validation, MinIO storage, text extraction, chunking, database persistence, and vector indexing.
3. **[BadRequestException.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/main/java/com/smartfarm/common/exception/BadRequestException.java)**: Added `BadRequestException(String message, Throwable cause)` constructor.
4. **[KnowledgeManagementControllerTest.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/test/java/com/smartfarm/features/knowledge/controller/KnowledgeManagementControllerTest.java)**: Added unit test cases for upload success and duplicate rejection.
5. **[KnowledgeManagementServiceTest.java](file:///C:/Users/Dell/Desktop/smart-farm-operations-platform-RAG/backend/src/test/java/com/smartfarm/features/knowledge/service/KnowledgeManagementServiceTest.java)**: Added unit test cases for upload flow, empty file rejection, unsupported format rejection, duplicate rejection, and extraction failure cleanup.

---

## 5. APIs
### `POST /api/v1/knowledge/documents`
- **Method**: `POST`
- **Consumes**: `multipart/form-data`
- **Produces**: `application/json`
- **Security**: `@PreAuthorize("hasRole('ADMIN')")`
- **Parameters**:
  - `file` (MultipartFile, required): PDF, DOCX, or TXT file.
  - `title` (String, required): Document title.
  - `source` (String, optional): Authoritative source organization.
  - `sourceType` (KnowledgeSourceType, required): e.g. `AGRICULTURAL_UNIVERSITY`, `GOVERNMENT_ADVISORY`, `RESEARCH_INSTITUTE`.
  - `language` (KnowledgeLanguage, required): e.g. `ENGLISH`, `TAMIL`, `HINDI`.
  - `crop` (String, optional): Target crop name.
  - `topic` (KnowledgeTopic, required): e.g. `CROP_MANAGEMENT`, `PEST_MANAGEMENT`, `SOIL`.
  - `authority` (String, optional): Publishing authority name.
  - `version` (String, optional): Release version or year (e.g. `2026`).
  - `publishedDate` (LocalDate, optional): ISO date (`YYYY-MM-DD`).
  - `lastVerifiedAt` (OffsetDateTime, optional): Verification timestamp.
  - `sourceUrl` (String, optional): URL reference.
  - `status` (KnowledgeDocumentStatus, optional): Defaults to `DRAFT`.
  - `metadata` (String JSON, optional): Structured metadata key-value pairs.
- **Success Response**: HTTP 201 Created
```json
{
  "documentId": "c0a80123-...",
  "title": "Rice Production Guide 2026",
  "source": "TNAU",
  "sourceType": "AGRICULTURAL_UNIVERSITY",
  "language": "ENGLISH",
  "crop": "Paddy",
  "topic": "CROP_MANAGEMENT",
  "authority": "Tamil Nadu Agricultural University",
  "version": "2026",
  "publishedDate": "2026-01-15",
  "lastVerifiedAt": null,
  "sourceUrl": "https://example.org/guide.pdf",
  "status": "DRAFT",
  "originalFilename": "rice_guide_2026.pdf",
  "contentType": "application/pdf",
  "fileSizeBytes": 1048576,
  "chunkCount": 18,
  "vectorCount": 18,
  "storagePath": "knowledge/c0a80123-.../rice_guide_2026.pdf",
  "ingestionStatus": "INGESTED",
  "createdAt": "2026-09-27T18:00:00Z"
}
```

---

## 6. Security
- Document ingestion is restricted to administrators (`ROLE_ADMIN`).
- Farmer, worker, and agronomist roles cannot upload or manage global documents.
- An unauthenticated request results in HTTP 401 Unauthorized.
- A request from non-administrative users (e.g. `ROLE_WORKER` or `ROLE_FARMER`) results in HTTP 403 Forbidden.
- Global knowledge documents have **no** relationship with `farmId`; the ingestion API rejects or ignores any farm association, preserving strictly global knowledge semantics.

---

## 7. Validation
- **File Validation**:
  - File presence: Empty files or null payloads return HTTP 400 Bad Request.
  - Safe filenames: Path traversal attempts (e.g., `../../etc/passwd`) are rejected.
  - Supported file types: Apache Tika content type detection and file extension checks enforce only `PDF`, `DOCX`, and `TXT`. Executables, scripts, and arbitrary binary files are rejected with HTTP 400 Bad Request.
- **Metadata Validation**:
  - `title`, `sourceType`, `language`, and `topic` are required. Missing values result in HTTP 400 Bad Request.
  - Unknown publication dates are kept as null (never fabricated).
- **Text Validation**:
  - If text extraction produces empty or un-parseable content, ingestion fails cleanly before persisting any active knowledge.

---

## 8. Duplicate / Version Handling
- **Duplicate Protection**:
  - Document identity is uniquely evaluated by `(title + version + source)`.
  - If an identical document already exists in the system, the ingestion is rejected with HTTP 400 Bad Request ("Document with title '...', version '...', and source '...' already exists").
  - MinIO files, chunks, and vector records are **not** created when a duplicate is rejected.
- **Versioning**:
  - Legitimate new versions (e.g. `version 2026` vs `version 2024` for the same title and source) are accepted and stored independently.
  - Older versions remain unaffected unless explicit Phase 2.6 lifecycle operations (such as archiving) are performed on them.

---

## 9. Lifecycle Integration
- Newly ingested documents default to status `DRAFT`.
- Vectors created during ingestion are stored in `vector_store` tagged with `status: 'DRAFT'`.
- `KnowledgeRetrievalService` strictly searches with `status = 'ACTIVE'`, guaranteeing that newly uploaded `DRAFT` documents are excluded from RAG retrieval.
- When an administrator calls `POST /api/v1/knowledge/documents/{id}/activate`, the document status transitions to `ACTIVE` and all corresponding vector metadata entries are updated to `status = 'ACTIVE'`, immediately including the document in RAG search.
- When `POST /api/v1/knowledge/documents/{id}/archive` is called, the document status transitions to `ARCHIVED` and all vector metadata entries are updated to `status = 'ARCHIVED'`, immediately excluding it from RAG search while preserving historical provenance.

---

## 10. Error Handling & Failure Safety
- **MinIO Upload Failure**: Ingestion aborts with an error before database records are created.
- **Extraction / Normalization / Chunking Failure**: If Tika extraction fails or produces empty content, the uploaded file in MinIO is immediately deleted, preventing orphan storage objects, and an HTTP 400 Bad Request is returned.
- **Database / Vector Store Failure**: Database operations run within transactional context; rollback prevents partial knowledge corruption.
- Safe cleanup never deletes or modifies pre-existing knowledge documents.

---

## 11. Tests
A comprehensive test suite of 250 tests was run.
Specific Phase 2.7 tests implemented in `KnowledgeDocumentIngestionIntegrationTest`, `KnowledgeManagementControllerTest`, and `KnowledgeManagementServiceTest`:
- **A & L**: PDF upload with `ROLE_ADMIN` successfully creates MinIO object, document, chunks, and vectors.
- **B**: DOCX upload successfully extracted, chunked, and ingested.
- **C**: TXT upload successfully extracted, chunked, and ingested.
- **D**: Unsupported file type rejected with HTTP 400 Bad Request.
- **E**: Empty file rejected with HTTP 400 Bad Request.
- **F**: Missing required metadata rejected with HTTP 400 Bad Request.
- **G**: Duplicate document `(title + version + source)` rejected with HTTP 400 Bad Request without duplicate records.
- **H**: New document version accepted and stored independently.
- **I**: Extraction failure on corrupt file safely caught with MinIO cleanup.
- **J**: Vector/embedding pipeline failure handled safely without marking document ACTIVE.
- **K**: Unauthenticated request rejected (401), non-admin role rejected (403).
- **M**: Newly ingested `DRAFT` document excluded from RAG retrieval.
- **N**: Activated document included in RAG retrieval.
- **O**: Archived document excluded from RAG retrieval.
- **P, Q, R, S, T**: MinIO object exists, PostgreSQL metadata exists, chunks exist, vectors exist, and chunk/vector parity is strictly maintained.

---

## 12. Full Maven Result
Execution command: `& "C:\apache-maven-3.9.16\bin\mvn.cmd" test` in `backend`:
```
[INFO] Results:
[INFO] 
[INFO] Tests run: 250, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  02:19 min
[INFO] Finished at: 2026-09-27T23:22:52+05:30
[INFO] ------------------------------------------------------------------------
```

---

## 13. Knowledge Integrity Result
PostgreSQL query executed directly on the live database:
```sql
SELECT 
    (SELECT count(*) FROM knowledge_documents WHERE status = 'ACTIVE') as active_docs,
    (SELECT count(*) FROM knowledge_documents) as total_docs,
    (SELECT count(*) FROM knowledge_chunks) as total_chunks,
    (SELECT count(*) FROM vector_store) as total_vectors,
    (SELECT count(*) FROM knowledge_chunks kc LEFT JOIN vector_store vs ON kc.id::text = vs.metadata->>'knowledgeChunkId' WHERE vs.id IS NULL) as missing_vectors,
    (SELECT count(*) FROM vector_store vs LEFT JOIN knowledge_chunks kc ON vs.metadata->>'knowledgeChunkId' = kc.id::text WHERE kc.id IS NULL) as orphan_vectors;
```
Result:
```
 active_docs | total_docs | total_chunks | total_vectors | missing_vectors | orphan_vectors 
-------------+------------+--------------+---------------+-----------------+----------------
           5 |          5 |         5291 |          5291 |               0 |              0
```
The 5 authoritative production documents (TNAU Blackgram, TNAU Crop Production Guide 2012, TNAU LGP, ICAR Kharif English, ICAR Kharif Multilingual) remain completely untouched and integral.

---

## 14. Known Limitations
- OCR is intentionally not supported in this phase (scanned images inside PDFs without embedded text will yield empty text and will be rejected).
- File upload is synchronous; extremely large PDFs (>100MB) could benefit from asynchronous background job processing in future phases.

---

## 15. Future Improvements
- Add batch ingestion endpoint for multiple documents at once.
- Add background worker queuing (e.g. via Redis/Celery/RabbitMQ) for asynchronous embedding generation on massive document libraries.
- Support OCR extraction via Tesseract for legacy scanned agricultural pamphlets.

---

Tests run: 250
Tests passed: 250
Tests failed: 0
Tests skipped: 0

Active documents: 5
Total documents: 5
Total chunks: 5291
Total vectors: 5291
Missing vectors: 0
Orphan vectors: 0

RAG verification: PASS
