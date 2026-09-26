package com.smartfarm.features.auth.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.auth.dto.AuthDtos.ChangePasswordRequest;
import com.smartfarm.features.auth.dto.AuthDtos.LoginRequest;
import com.smartfarm.features.auth.dto.AuthDtos.OtpRequest;
import com.smartfarm.features.auth.dto.AuthDtos.OtpVerifyRequest;
import com.smartfarm.features.auth.dto.AuthDtos.RegisterRequest;
import com.smartfarm.features.auth.dto.AuthDtos.UpdateProfileRequest;
import com.smartfarm.features.auth.dto.AuthDtos.UserProfileResponse;
import com.smartfarm.features.auth.service.AuthService;
import com.smartfarm.features.auth.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final OtpService otpService;
    private final AuthService authService;

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        Map<String, Object> result = authService.register(request, clientIp);
        return ApiResponse.success(result);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        Map<String, Object> result = authService.loginWithPassword(request, clientIp);
        return buildAuthResponse(result);
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileResponse> getProfile(@AuthenticationPrincipal UUID userId) {
        UserProfileResponse profile = authService.getProfile(userId);
        return ApiResponse.success(profile);
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        UserProfileResponse profile = authService.updateProfile(userId, request, clientIp);
        return ApiResponse.success(profile);
    }

    @PutMapping("/change-password")
    public ApiResponse<String> changePassword(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);
        authService.changePassword(userId, request, clientIp);
        return ApiResponse.success("Password changed successfully");
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refresh(@CookieValue(name = "refresh_token", required = true) String refreshToken) {
        Map<String, Object> result = authService.refreshTokens(refreshToken);
        return buildAuthResponse(result);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal UUID userId,
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletRequest httpRequest) {
        
        String clientIp = getClientIp(httpRequest);
        if (userId != null) {
            authService.logout(userId, refreshToken, clientIp);
        }

        ResponseCookie cookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(false)
                .path("/api/v1/auth/refresh")
                .maxAge(0)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(null));
    }

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

    private ResponseEntity<ApiResponse<Map<String, Object>>> buildAuthResponse(Map<String, Object> result) {
        String refreshToken = (String) result.get("refreshToken");

        ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(false)
                .path("/api/v1/auth/refresh")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(Map.of(
                        "accessToken", result.get("accessToken"),
                        "user", result.get("user")
                )));
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
