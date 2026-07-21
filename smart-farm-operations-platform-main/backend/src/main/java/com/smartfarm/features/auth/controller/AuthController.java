package com.smartfarm.features.auth.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.auth.dto.AuthDtos.LoginRequest;
import com.smartfarm.features.auth.dto.AuthDtos.OtpRequest;
import com.smartfarm.features.auth.dto.AuthDtos.OtpVerifyRequest;
import com.smartfarm.features.auth.dto.AuthDtos.RegisterRequest;
import com.smartfarm.features.auth.service.AuthService;
import com.smartfarm.features.auth.service.OtpService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final OtpService otpService;
    private final AuthService authService;

    @PostMapping("/otp/request")
    public ApiResponse<Void> requestOtp(@Valid @RequestBody OtpRequest request) {
        otpService.generateAndSendOtp(request.getPhone());
        return ApiResponse.success(null);
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        Map<String, Object> result = authService.verifyOtpAndLogin(request.getPhone(), request.getCode());
        return buildAuthResponse(result);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> result = authService.loginWithPassword(request);
        return buildAuthResponse(result);
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest request) {
        Map<String, Object> result = authService.register(request);
        return buildAuthResponse(result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(@CookieValue(name = "refresh_token", required = true) String refreshToken) {
        Map<String, Object> result = authService.refreshTokens(refreshToken);
        return buildAuthResponse(result);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UUID userId,
            @CookieValue(name = "refresh_token", required = false) String refreshToken) {
        
        if (refreshToken != null) {
            authService.logout(userId, refreshToken);
        }
        
        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/api/v1/auth/refresh")
                .maxAge(0)
                .build();
                
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(null));
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> buildAuthResponse(Map<String, Object> result) {
        String refreshToken = (String) result.get("refreshToken");
        
        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true) // Should be false in dev HTTP, true in prod HTTPS. Ignoring for this scaffold
                .path("/api/v1/auth/refresh")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Strict")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(Map.of(
                        "accessToken", result.get("accessToken"),
                        "tokens", Map.of("accessToken", result.get("accessToken")),
                        "user", result.get("user")
                )));
    }
}
