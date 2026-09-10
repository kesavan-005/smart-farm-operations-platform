package com.smartfarm.features.auth.dto;

import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.SensitivePermission;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateManagerPermissionsRequest {
    private Map<FarmModule, ModuleAccessLevel> moduleAccess;
    private List<SensitivePermission> sensitivePermissions;
}
