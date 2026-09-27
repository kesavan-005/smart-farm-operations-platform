# Phase 2.5 — Final Vector / Chunk Integrity Report

**Project**: Uzhavan Smart Farm Operations Platform (RAG)  
**Backend**: `C:\Users\Dell\Desktop\smart-farm-operations-platform-RAG\backend`  
**Date**: September 27, 2026  
**Status**: VERIFIED & RESOLVED (100% 1:1 Parity Achieved: 5,291 Chunks = 5,291 Vectors)

---

## 1. Executive Summary

A comprehensive, read-only root-cause investigation into the initial count discrepancy (`knowledge_chunks` = 5,294 vs `vector_store` = 5,293) was performed. 

The investigation conclusively proved:
1. **Zero Production Ingestion Errors**: All 5 real agricultural documents ingested during Phase 2.5 had produced an exact 1:1 chunk-to-vector correspondence (5,291 chunks and 5,291 vectors). Zero vectors failed to embed, and zero vectors were orphaned during production ingestion.
2. **Root Cause of the +1 Discrepancy**: The difference of 1 originated entirely from residual test fixtures left behind in the development database by earlier integration tests:
   - `KnowledgeIngestionIntegrationTest` ingested test fixtures with 3 chunks into `knowledge_documents` and `knowledge_chunks`, but its `@AfterEach` teardown only deleted records from `vector_store` matching `'Integration Test%'`, leaving behind 3 relational chunks in `knowledge_chunks` with 0 corresponding vectors.
   - `DocumentExtractionIngestionIntegrationTest` and `KnowledgeSeedIntegrationTest` deleted test documents from `documentRepository` in their teardown, which cascaded to `knowledge_chunks`, but did not delete from `vector_store`, leaving behind 2 orphaned test vectors.
   - Pre-seeding baseline math: 3 leftover test chunks − 2 leftover test vectors = **+1 discrepancy**.
   - Combined with real documents: `5,291 + 3 = 5,294` chunks vs `5,291 + 2 = 5,293` vectors.
3. **Collateral Test Behavior**: `RagEvaluationIntegrationTest.setUp()` contained an unqualified `DELETE FROM vector_store / knowledge_chunks / knowledge_documents` that cleared persistent data upon running `mvn test`.
4. **Resolution Implemented**:
   - Scoped `RagEvaluationIntegrationTest.setUp()` to only clean up fixtures matching `'Eval%'`.
   - Updated `KnowledgeIngestionIntegrationTest.cleanUp()` to delete from `knowledge_documents` and `knowledge_chunks` for `'Integration Test%'`.
   - Updated `DocumentExtractionIngestionIntegrationTest.tearDown()` and `KnowledgeSeedIntegrationTest.tearDown()` to delete vector store records for `createdDocId`.
   - Re-seeded the 5 real agricultural documents through `KnowledgeSeedRunner` into the clean repository.
5. **Final Audit**:
   - `knowledge_chunks` = **5,291**
   - `vector_store` = **5,291**
   - `chunks_without_vectors` = **0**
   - `vectors_without_chunks` = **0**
   - Maven test suite (`mvn test`): **198 tests run, 0 failures, 0 errors, 0 skipped**.
   - Post-test database check: **Counts remain perfectly intact at 5,291 / 5,291**.

---

## 2. Integrity Metrics & Verification

| Metric | Baseline Count | Discrepancy Point | Final Clean Verified Count |
|---|---|---|---|
| **Real Documents (`knowledge_documents`)** | 0 | 5 (+2 test docs = 7) | **5** (100% ACTIVE real docs) |
| **Total Chunks (`knowledge_chunks`)** | 3 (test) | 5,294 (5,291 real + 3 test) | **5,291** |
| **Total Vectors (`vector_store`)** | 2 (test) | 5,293 (5,291 real + 2 test) | **5,291** |
| **Missing-Vector Chunks** | 3 (test) | 3 (test) | **0** |
| **Orphan Vectors** | 2 (test) | 2 (test) | **0** |
| **Discrepancy (Chunks − Vectors)** | +1 | +1 | **0** (Exact 1:1 Parity) |

### Verification SQL Queries & Outputs
```sql
-- 1. Table Counts
SELECT 'knowledge_documents' AS tbl, COUNT(*) FROM knowledge_documents 
UNION ALL 
SELECT 'ACTIVE_docs', COUNT(*) FROM knowledge_documents WHERE status='ACTIVE' 
UNION ALL 
SELECT 'knowledge_chunks', COUNT(*) FROM knowledge_chunks 
UNION ALL 
SELECT 'vector_store', COUNT(*) FROM vector_store;
```
**Output**:
```text
         tbl         | count 
---------------------+-------
 knowledge_documents |     5
 ACTIVE_docs         |     5
 knowledge_chunks    |  5291
 vector_store        |  5291
```

```sql
-- 2. Missing-Vector Chunks
SELECT COUNT(*) AS chunks_without_vectors 
FROM knowledge_chunks kc 
LEFT JOIN vector_store vs ON kc.id = vs.id 
WHERE vs.id IS NULL;
```
**Output**: `0`

```sql
-- 3. Orphan Vectors
SELECT COUNT(*) AS vectors_without_chunks 
FROM vector_store vs 
LEFT JOIN knowledge_chunks kc ON vs.id = kc.id 
WHERE kc.id IS NULL;
```
**Output**: `0`

---

## 3. Real Document Breakdown

All 5 authoritative real publications exhibit exact 1-to-1 parity between relational chunks and vector store embeddings:

| # | Document Title | Authority | Version | Chunks in PostgreSQL | Vectors in `vector_store` | Integrity Delta |
|---|---|---|---|---|---|---|
| 1 | Crop Production - Pulses: Blackgram (Vigna mungo L.) | Tamil Nadu Agricultural University (TNAU) | 2013 | 15 | 15 | 0 |
| 2 | Crop Production Guide 2012 | Department of Agriculture, Govt. of Tamil Nadu & TNAU | 2012 | 1,145 | 1,145 | 0 |
| 3 | Length of Growing Period based Cropping Pattern for different Agro-ecological Zones of Tamil Nadu | Dept. of Remote Sensing and GIS, DNRM, TNAU | Publication No. 2/2011 | 85 | 85 | 0 |
| 4 | ICAR Kharif Agro-Advisories for Farmers 2025 (English Edition) | Division of Agricultural Extension & ATARI, ICAR | 2025 (English Edition) | 2,084 | 2,084 | 0 |
| 5 | ICAR Kharif Agro-Advisory 2025 for Farmers (Regional Languages Edition) | Division of Agricultural Extension & ATARI, ICAR | 2025 (Regional Languages Edition) | 1,962 | 1,962 | 0 |
| **Total** | | | | **5,291** | **5,291** | **0** |

---

## 4. Root Cause Analysis of the Discrepancy

### Investigation Step 1: Mapping Schema
In `KnowledgeIngestionService`:
- When chunking a document, each `KnowledgeChunk` receives a UUID `chunk.getId()`.
- When inserting into `vector_store`:
  ```java
  Document vectorDoc = new Document(chunk.getId().toString(), chunk.getContent(), meta);
  ```
- Therefore, in the PgVector `vector_store` table, `vector_store.id` is identical to `knowledge_chunks.id`.

### Investigation Step 2: Identification of the Extra Chunk & Orphan Vectors
Querying the database at the 5,294 vs 5,293 state revealed:
1. **The 3 Chunks without Vectors**:
   - Document `Integration Test Soil Moisture Management` (1 chunk: `afc76fae-5712-4a17-82fb-b69c7dbdddf1`)
   - Document `Integration Test Paddy Fertilizer Guide` (2 chunks: `b00fc018-ffdd-4c9f-a6af-26eb4e16ce0f`, `de2ea3ff-0895-49ab-8f70-29912567fa23`)
   - Origin: `KnowledgeIngestionIntegrationTest`
   - Cause: `KnowledgeIngestionIntegrationTest.cleanUp()` only issued `DELETE FROM vector_store WHERE metadata->>'title' LIKE 'Integration Test%'`, deleting the vector embeddings while leaving the relational chunks in PostgreSQL.
2. **The 2 Vectors without Chunks**:
   - Vector `01abcd9f-68e7-49d8-bef6-cc212208db3d` (`TNAU Paddy Blast Guide 2026` from `DocumentExtractionIngestionIntegrationTest`)
   - Vector `9c6395cf-57d9-4fbf-a3c6-71bd97df2ddd` (`Test Agricultural Guidance 2026` from `KnowledgeSeedIntegrationTest`)
   - Cause: `documentRepository.deleteById(createdDocId)` removed relational document and chunk rows (via foreign key cascade), but did not delete the vector from the unconstrained `vector_store` table.
3. **Net Discrepancy**:
   - 3 chunks without vectors − 2 vectors without chunks = **+1 extra chunk**.
   - Neither of these was related to the real agricultural documents.

---

## 5. Actions Taken

To guarantee persistent integrity and ensure tests never contaminate or wipe production knowledge:

1. **Fixed `RagEvaluationIntegrationTest.java`**:
   - Removed lines 187–189 (`DELETE FROM vector_store`, `DELETE FROM knowledge_chunks`, `DELETE FROM knowledge_documents`).
   - Retained scoped cleanup: `DELETE ... WHERE metadata->>'title' LIKE 'Eval%'` and `DELETE FROM knowledge_documents WHERE title LIKE 'Eval%'`.
2. **Fixed `KnowledgeIngestionIntegrationTest.java`**:
   - Updated `cleanUp()` to delete from `knowledge_documents` and `knowledge_chunks` for `'Integration Test%'` fixtures alongside `vector_store`.
3. **Fixed `DocumentExtractionIngestionIntegrationTest.java` & `KnowledgeSeedIntegrationTest.java`**:
   - Updated `tearDown()` to delete vectors from `vector_store WHERE metadata->>'knowledgeDocumentId' = createdDocId` prior to calling `documentRepository.deleteById(createdDocId)`.
4. **Re-seeded Real Agricultural Knowledge**:
   - Cleaned test artifacts from database.
   - Ran `KnowledgeSeedRunner` (`KNOWLEDGE_SEED_ENABLED=true`).
   - All 5 documents seeded with 5,291 chunks and 5,291 vectors.

---

## 6. Maven Test Suite Results

Full regression verification executed:
```powershell
& "C:\apache-maven-3.9.16\bin\mvn.cmd" test
```

### Build Result
```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 198, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  01:33 min
[INFO] Finished at: 2026-09-27T17:56:55+05:30
```

### Post-Test Database State Verification
Immediately following the test execution, PostgreSQL was re-queried:
- `knowledge_documents`: **5**
- `ACTIVE_docs`: **5**
- `knowledge_chunks`: **5,291**
- `vector_store`: **5,291**
- `chunks_without_vectors`: **0**
- `vectors_without_chunks`: **0**

The test suite now runs with 100% test fixture isolation without mutating or polluting the persistent knowledge base.

---

## 7. Conclusion

The investigation is complete. The count discrepancy has been fully accounted for, the test isolation gaps have been resolved, and **100% 1-to-1 chunk-to-vector parity (5,291 = 5,291)** is verified and preserved across test suite runs.

Phase 2.5 is completely verified and ready for Phase 2.6.
