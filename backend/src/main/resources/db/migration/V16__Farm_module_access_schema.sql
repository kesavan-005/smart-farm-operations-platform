-- Migration V16: Add Farm Member Module Access & Sensitive Permissions Schema

-- 1. Extend user_farm_roles with is_active
ALTER TABLE user_farm_roles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_user_farm_roles_active 
ON user_farm_roles(user_id, farm_id, is_active);

-- 2. Create farm_member_module_access table
CREATE TABLE IF NOT EXISTS farm_member_module_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_membership_id UUID NOT NULL,
    module VARCHAR(50) NOT NULL,
    access_level VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_module_access_membership FOREIGN KEY (farm_membership_id) 
        REFERENCES user_farm_roles(id) ON DELETE CASCADE,
    CONSTRAINT uk_membership_module UNIQUE(farm_membership_id, module)
);

CREATE INDEX IF NOT EXISTS idx_module_access_membership 
ON farm_member_module_access(farm_membership_id);

-- 3. Create farm_member_sensitive_permissions table
CREATE TABLE IF NOT EXISTS farm_member_sensitive_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_membership_id UUID NOT NULL,
    permission VARCHAR(50) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID,
    CONSTRAINT fk_sensitive_perm_membership FOREIGN KEY (farm_membership_id) 
        REFERENCES user_farm_roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_sensitive_perm_granter FOREIGN KEY (granted_by) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_membership_permission UNIQUE(farm_membership_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_sensitive_perm_membership 
ON farm_member_sensitive_permissions(farm_membership_id);
