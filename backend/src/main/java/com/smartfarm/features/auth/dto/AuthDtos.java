package com.smartfarm.features.auth.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public class AuthDtos {

    @Data
    public static class OtpRequest {
        @NotBlank(message = "Phone number is required")
        private String phone;
    }

    @Data
    public static class OtpVerifyRequest {
        @NotBlank(message = "Phone number is required")
        private String phone;

        @NotBlank(message = "OTP code is required")
        private String code;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LoginRequest {
        @NotBlank(message = "Username, email or phone is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegisterRequest {
        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @NotBlank(message = "Username is required")
        @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_.-]+$", message = "Username can only contain alphanumeric characters, underscores, dots, and hyphens")
        private String username;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Mobile number is required")
        private String phone;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters long")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&)"
        )
        private String password;

        @NotBlank(message = "Password confirmation is required")
        private String confirmPassword;

        private String role; // FARM_OWNER, ADMIN, FARM_MANAGER, SUPERVISOR, WORKER, VIEWER

        private String farmName;

        @Builder.Default
        private String language = "en";

        @AssertTrue(message = "You must accept the terms and conditions")
        private Boolean acceptTerms;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String oldPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "New password must be at least 8 characters long")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
            message = "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character"
        )
        private String newPassword;

        @NotBlank(message = "New password confirmation is required")
        private String confirmPassword;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        @NotBlank(message = "First name is required")
        private String firstName;

        @NotBlank(message = "Last name is required")
        private String lastName;

        @Email(message = "Invalid email format")
        private String email;

        private String phone;
        private String preferredLanguage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserProfileResponse {
        private UUID id;
        private String firstName;
        private String lastName;
        private String username;
        private String name;
        private String email;
        private String phone;
        private String role;
        private UUID farmId;
        private String farmName;
        private String avatar;
        private String language;
        private boolean active;
        private boolean verified;
        private List<String> permissions;
    }
}
