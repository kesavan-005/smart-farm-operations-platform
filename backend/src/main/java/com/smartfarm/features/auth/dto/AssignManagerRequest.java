package com.smartfarm.features.auth.dto;

import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.SensitivePermission;
import jakarta.validation.constraints.NotNull;
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
public class AssignManagerRequest {
    @NotNull(message = "userId is required")
    private UUID userId;

    private Map<FarmModule, ModuleAccessLevel> moduleAccess;
    private List<SensitivePermission> sensitivePermissions;
}
