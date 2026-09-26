package com.smartfarm.features.auth.dto;

import com.smartfarm.features.auth.domain.FarmModule;
import com.smartfarm.features.auth.domain.ModuleAccessLevel;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.SensitivePermission;
import java.util.EnumMap;
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
public class FarmPermissionMatrixDTO {
    private UUID farmId;
    private Role role;
    private Map<FarmModule, ModuleAccessLevel> modules;
    private List<SensitivePermission> sensitivePermissions;

    public static FarmPermissionMatrixDTO createOwnerMatrix(UUID farmId) {
        Map<FarmModule, ModuleAccessLevel> ownerModules = new EnumMap<>(FarmModule.class);
        for (FarmModule module : FarmModule.values()) {
            ownerModules.put(module, ModuleAccessLevel.FULL_ACCESS);
        }
        return FarmPermissionMatrixDTO.builder()
                .farmId(farmId)
                .role(Role.FARM_OWNER)
                .modules(ownerModules)
                .sensitivePermissions(List.of(SensitivePermission.values()))
                .build();
    }
}
