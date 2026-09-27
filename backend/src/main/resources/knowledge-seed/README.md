# Uzhavan Permanent Trusted Agricultural Knowledge Seed Repository

## Purpose
This directory houses the permanent, authoritative agricultural knowledge source documents for the Uzhavan Smart Farm Operations Platform.
All documents in this repository are global agricultural knowledge accessible to all authenticated farmers and users through the Smart Farm RAG system.

## Organization
- `tnau/`: Tamil Nadu Agricultural University (TNAU) publications, crop production guides, and university bulletins.
- `icar/`: Indian Council of Agricultural Research (ICAR) guidelines, institute manuals, package of practices.
- `kvk/`: Krishi Vigyan Kendra extension advisories, district-level guides.
- `government/`: Central and State Agricultural Departments, Directorate of Agriculture schemes, fertilizer recommendations, pest management advisories.

## Supported File Formats
- **PDF** (`application/pdf`)
- **DOCX** (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- **TXT** (`text/plain`)

*Note: Scanned or image-only documents requiring OCR are rejected until OCR capabilities are introduced.*

## Manifest Specification (`manifest.json`)
Every document to be ingested must have an explicit metadata entry in `manifest.json`.

```json
{
  "documents": [
    {
      "filePath": "tnau/paddy-production-guide.pdf",
      "title": "TNAU System of Rice Intensification (SRI) Manual",
      "source": "Tamil Nadu Agricultural University (TNAU)",
      "sourceType": "AGRICULTURAL_UNIVERSITY",
      "language": "ENGLISH",
      "crop": "Paddy",
      "topic": "CROP_MANAGEMENT",
      "authority": "Directorate of Extension Education, TNAU Coimbatore",
      "version": "2024.1",
      "publishedDate": "2024-01-15",
      "lastVerifiedAt": "2026-01-01T00:00:00Z",
      "sourceUrl": "https://agritech.tnau.ac.in/agriculture/agri_sri.html",
      "status": "ACTIVE",
      "metadata": "{\"category\":\"production_guide\",\"target_season\":\"Kharif/Rabi\"}"
    }
  ]
}
```

### Supported Enums
- **`sourceType`**: `GOVERNMENT`, `AGRICULTURAL_UNIVERSITY`, `RESEARCH_INSTITUTION`, `EXTENSION_SERVICE`, `SCIENTIFIC_PUBLICATION`, `OFFICIAL_GUIDANCE`, `OTHER`
- **`language`**: `ENGLISH`, `TAMIL`, `MULTILINGUAL`
- **`topic`**: `SOIL`, `IRRIGATION`, `FERTILIZATION`, `PEST_MANAGEMENT`, `DISEASE_MANAGEMENT`, `CROP_MANAGEMENT`, `WEATHER_RESPONSE`, `HARVESTING`, `NUTRIENT_MANAGEMENT`, `WEED_MANAGEMENT`, `GENERAL_FARMING`
- **`status`**: `ACTIVE` (searchable by RAG), `DRAFT` (stored without vector indexing), `ARCHIVED` (retained, excluded from search)

## Activation
By default, automatic seed ingestion on application startup is **disabled** (`smartfarm.knowledge.seed.enabled=false`).
To enable ingestion during controlled startup:
```yaml
smartfarm:
  knowledge:
    seed:
      enabled: true
      location: classpath:knowledge-seed/
      manifest-file: manifest.json
```
Or via environment variable:
```bash
KNOWLEDGE_SEED_ENABLED=true
```

## Ingestion Pipeline
1. Original binary document is saved permanently to MinIO bucket `smartfarm-knowledge` at `knowledge/{documentId}/{sanitizedFilename}`.
2. Text content is extracted using `DocumentTextExtractor` (Apache Tika).
3. Text is normalized using `TextNormalizer`.
4. Text is deterministically chunked using `DeterministicChunker` (1000 char chunks with 150 char overlap).
5. For `ACTIVE` documents, 384-dimensional embeddings are generated with in-process `all-MiniLM-L6-v2` and stored in PostgreSQL `vector_store` (pgvector).
6. Idempotency is enforced: previously ingested documents (matching title, version, source) are skipped without creating duplicate chunks or vectors.
