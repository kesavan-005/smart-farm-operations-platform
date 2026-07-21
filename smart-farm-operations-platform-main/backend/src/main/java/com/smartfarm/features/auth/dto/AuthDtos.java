package com.smartfarm.features.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

public class AuthDtos {

    @Data
    public static class OtpRequest {
        @NotBlank
        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
        private String phone;
    }

    @Data
    public static class OtpVerifyRequest {
        @NotBlank
        @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$")
        private String phone;
        
        @NotBlank
        private String code;
    }

    @Data
    public static class LoginRequest {
        @NotBlank
        private String phone;
        
        @NotBlank
        private String password;
    }

    @Data
    public static class RegisterRequest {
        @NotBlank
        private String phone;
        
        @NotBlank
        private String name;
        
        @NotBlank
        private String otpCode;
        
        private String password;
        
        private String preferredLanguage = "en";
    }
}
