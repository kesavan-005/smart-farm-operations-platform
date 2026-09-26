-- Enable PostGIS extension for spatial data (farm/field boundaries)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Sync Log table for tracking offline mutations and conflicts
CREATE TABLE sync_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    payload JSONB,
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
