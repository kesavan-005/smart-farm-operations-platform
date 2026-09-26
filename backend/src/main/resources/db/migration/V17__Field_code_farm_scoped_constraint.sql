-- Migration V17: Fix Field Code to Farm-Scoped Sequential Format
-- Replaces global UNIQUE with farm-scoped UNIQUE(farm_id, field_code)
-- Regenerates all existing field codes to <FARM_CODE>-F<NN> format

-- Step 1: Drop the global unique constraint on field_code
ALTER TABLE fields DROP CONSTRAINT IF EXISTS fields_field_code_key;

-- Step 2: Regenerate all existing field codes to canonical farm-scoped format
-- For each farm, assign sequential codes ordered by creation time.
-- This regenerates even previously assigned codes (safe in development/seed mode).
DO $$
DECLARE
  r_farm RECORD;
  r_field RECORD;
  v_seq INT;
  v_farm_code VARCHAR;
BEGIN
  FOR r_farm IN
    SELECT DISTINCT f.farm_id
    FROM fields f
    WHERE f.deleted = false
    ORDER BY f.farm_id
  LOOP
    -- Get the farm's code
    SELECT fa.farm_code INTO v_farm_code
    FROM farms fa
    WHERE fa.id = r_farm.farm_id;

    IF v_farm_code IS NULL THEN
      CONTINUE;
    END IF;

    v_seq := 1;

    -- Assign codes in creation order (oldest first)
    FOR r_field IN
      SELECT id
      FROM fields
      WHERE farm_id = r_farm.farm_id
      ORDER BY created_at ASC, id ASC
    LOOP
      UPDATE fields
      SET field_code = v_farm_code || '-F' || LPAD(v_seq::TEXT, 2, '0')
      WHERE id = r_field.id;
      v_seq := v_seq + 1;
    END LOOP;
  END LOOP;
END;
$$;

-- Step 3: Add the farm-scoped unique constraint (replaces global unique)
ALTER TABLE fields
  ADD CONSTRAINT uk_farm_field_code UNIQUE (farm_id, field_code);

-- Step 4: Add index to support efficient field_code lookups per farm
CREATE INDEX IF NOT EXISTS idx_fields_farm_field_code
  ON fields (farm_id, field_code)
  WHERE deleted = false;
