-- Migration V15: Add boundary column to farms table
ALTER TABLE farms ADD COLUMN boundary GEOMETRY(Polygon, 4326);

-- Add spatial index for performance
CREATE INDEX idx_farms_boundary ON farms USING GIST(boundary);
