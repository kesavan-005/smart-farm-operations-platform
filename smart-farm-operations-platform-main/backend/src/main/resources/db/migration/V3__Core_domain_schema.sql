CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farm_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ta VARCHAR(100),
    description TEXT,
    description_ta TEXT,
    total_area NUMERIC(10, 2),
    area_unit VARCHAR(10),
    address TEXT,
    village VARCHAR(100),
    taluk VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    soil_type VARCHAR(50),
    soil_ph NUMERIC(4, 2),
    soil_organic_carbon NUMERIC(5, 2),
    irrigation_type VARCHAR(50),
    water_source VARCHAR(50),
    water_availability VARCHAR(100),
    drainage_type VARCHAR(100),
    average_rainfall NUMERIC(6, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    field_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_ta VARCHAR(100),
    area NUMERIC(10, 2),
    area_unit VARCHAR(10),
    boundary GEOMETRY(Polygon, 4326),
    soil_type VARCHAR(50),
    soil_ph NUMERIC(4, 2),
    soil_organic_carbon NUMERIC(5, 2),
    irrigation_type VARCHAR(50),
    water_availability VARCHAR(100),
    drainage_type VARCHAR(100),
    average_rainfall NUMERIC(6, 2),
    elevation NUMERIC(10, 2),
    notes TEXT,
    notes_ta TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ta VARCHAR(100),
    variety VARCHAR(100),
    season VARCHAR(50),
    sowing_date DATE,
    expected_harvest_date DATE,
    planting_method VARCHAR(50),
    expected_yield NUMERIC(10, 2),
    yield_unit VARCHAR(10),
    notes TEXT,
    notes_ta TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for performance
CREATE INDEX idx_farms_owner ON farms(owner_user_id) WHERE deleted = FALSE;
CREATE INDEX idx_fields_farm ON fields(farm_id) WHERE deleted = FALSE;
CREATE INDEX idx_crops_field ON crops(field_id) WHERE deleted = FALSE;
CREATE INDEX idx_fields_boundary ON fields USING GIST(boundary);

-- Add constraint to user_farm_roles
ALTER TABLE user_farm_roles ADD CONSTRAINT fk_user_farm_roles_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE;
