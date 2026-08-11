-- V13__Add_missing_task_columns.sql
-- Add columns that exist in the Task entity but are missing from the tasks table

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(12, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS inventory_quantity_used NUMERIC(10, 2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL;
