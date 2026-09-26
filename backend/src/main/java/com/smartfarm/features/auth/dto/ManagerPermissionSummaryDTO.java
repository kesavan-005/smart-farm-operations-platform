package com.smartfarm.features.auth.dto;

import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.SensitivePermission;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManagerPermissionSummaryDTO {
    private UUID membershipId;
    private UUID userId;
    private String fullName;
    private String email;
    private Role role;
    private boolean active;
    private Map<FarmModule, ModuleAccessLevel> moduleAccess;
    private List<SensitivePermission> sensitivePermissions;
    private OffsetDateTime grantedAt;
}
