package com.smartfarm.features.auth.dto;

import com.smartfarm.features.auth.domain.Role;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryDTO {
    private UUID id;
    private String fullName;
    private String email;
    private Role role;
}
