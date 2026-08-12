CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL, -- IRRIGATION, FERTILIZER, PESTICIDE, HARVEST, PLANTING, SOIL_TEST, MAINTENANCE, INSPECTION, OTHER
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, COMPLETED, CANCELLED
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    estimated_duration INT, -- in minutes
    actual_duration INT, -- in minutes
    notes TEXT,
    attachments TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_activities_farm ON activities(farm_id) WHERE deleted = FALSE;
CREATE INDEX idx_activities_field ON activities(field_id) WHERE deleted = FALSE;
CREATE INDEX idx_activities_crop ON activities(crop_id) WHERE deleted = FALSE;
CREATE INDEX idx_activities_performed_by ON activities(performed_by) WHERE deleted = FALSE;
CREATE INDEX idx_activities_scheduled ON activities(scheduled_date);
