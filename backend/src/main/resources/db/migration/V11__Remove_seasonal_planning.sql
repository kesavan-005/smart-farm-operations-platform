-- V11__Remove_seasonal_planning.sql
ALTER TABLE activities DROP COLUMN IF EXISTS seasonal_plan_id;
DROP TABLE IF EXISTS seasonal_plans CASCADE;
