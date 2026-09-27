-- Flyway Migration V20: Add original document storage metadata to knowledge_documents
-- Stores object storage references (e.g. MinIO) for original agricultural knowledge files

ALTER TABLE knowledge_documents
    ADD COLUMN original_filename VARCHAR(255),
    ADD COLUMN content_type VARCHAR(100),
    ADD COLUMN file_size_bytes BIGINT,
    ADD COLUMN storage_path VARCHAR(500);
