CREATE TABLE seasonal_plans (
    id UUID PRIMARY KEY,
    farm_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    target_yield NUMERIC,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_seasonal_plan_farm FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
);

CREATE INDEX idx_seasonal_plans_farm ON seasonal_plans(farm_id);
CREATE INDEX idx_seasonal_plans_status ON seasonal_plans(status);

ALTER TABLE activities ADD COLUMN seasonal_plan_id UUID;
ALTER TABLE activities ADD CONSTRAINT fk_activity_seasonal_plan FOREIGN KEY (seasonal_plan_id) REFERENCES seasonal_plans(id) ON DELETE SET NULL;
CREATE INDEX idx_activities_seasonal_plan ON activities(seasonal_plan_id);

ALTER TABLE tasks ADD COLUMN assigned_equipment_id UUID;
ALTER TABLE tasks ADD CONSTRAINT fk_task_assigned_equipment FOREIGN KEY (assigned_equipment_id) REFERENCES equipment(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_assigned_equipment ON tasks(assigned_equipment_id);
