package com.smartfarm.features.auth.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class UserDtos {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileResponse {
        private UUID id;
        private String name;
        private String phone;
        private String email;
        private String role;
        private String preferredLanguage;
        private String profilePhotoUrl;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserProfileUpdateRequest {
        private String name;
        private String email;
        private String preferredLanguage;
        private String profilePhotoUrl;
    }
}
