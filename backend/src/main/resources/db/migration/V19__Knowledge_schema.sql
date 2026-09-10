-- Flyway Migration V19: Knowledge Base Schema for RAG Agricultural Advisory
-- Creates knowledge_documents and knowledge_chunks relational tables and indexes

CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    source VARCHAR(255),
    source_type VARCHAR(50) NOT NULL,
    language VARCHAR(30) NOT NULL,
    crop VARCHAR(100),
    topic VARCHAR(50) NOT NULL,
    authority VARCHAR(255),
    version VARCHAR(50),
    published_date DATE,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    source_url TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
    content TEXT NOT NULL,
    language VARCHAR(30),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_knowledge_chunks_doc_index UNIQUE (document_id, chunk_index)
);

-- Relational indexes for knowledge_documents filtering
CREATE INDEX idx_knowledge_documents_status ON knowledge_documents(status);
CREATE INDEX idx_knowledge_documents_language ON knowledge_documents(language);
CREATE INDEX idx_knowledge_documents_crop ON knowledge_documents(crop);
CREATE INDEX idx_knowledge_documents_topic ON knowledge_documents(topic);
CREATE INDEX idx_knowledge_documents_authority ON knowledge_documents(authority);
CREATE INDEX idx_knowledge_documents_source_type ON knowledge_documents(source_type);

-- Relational indexes for knowledge_chunks lookups and ordering
CREATE INDEX idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_chunks_doc_chunk_idx ON knowledge_chunks(document_id, chunk_index);
