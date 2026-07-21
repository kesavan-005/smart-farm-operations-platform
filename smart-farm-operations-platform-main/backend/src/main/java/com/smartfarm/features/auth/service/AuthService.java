package com.smartfarm.features.auth.service;

import com.smartfarm.common.exception.UnauthorizedException;
import com.smartfarm.features.auth.domain.RefreshToken;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.dto.AuthDtos.LoginRequest;
import com.smartfarm.features.auth.dto.AuthDtos.RegisterRequest;
import com.smartfarm.features.auth.repository.RefreshTokenRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.security.TokenProvider;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OtpService otpService;
    private final TokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public Map<String, Object> verifyOtpAndLogin(String phone, String code) {
        if (!otpService.verifyOtp(phone, code)) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }
        
        User user = userRepository.findByPhoneAndDeletedAtIsNull(phone)
                .orElseThrow(() -> new UnauthorizedException("User not registered"));
                
        return generateTokens(user);
    }

    @Transactional
    public Map<String, Object> loginWithPassword(LoginRequest request) {
        User user = userRepository.findByPhoneAndDeletedAtIsNull(request.getPhone())
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));
                
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        
        return generateTokens(user);
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request) {
        if (!otpService.verifyOtp(request.getPhone(), request.getOtpCode())) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }
        
        if (userRepository.findByPhoneAndDeletedAtIsNull(request.getPhone()).isPresent()) {
            throw new RuntimeException("Phone number already exists");
        }
        
        User user = User.builder()
                .phone(request.getPhone())
                .name(request.getName())
                .preferredLanguage(request.getPreferredLanguage())
                .build();
                
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        
        user = userRepository.save(user);
        
        return generateTokens(user);
    }

    @Transactional
    public Map<String, Object> refreshTokens(String refreshTokenString) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(passwordEncoder.encode(refreshTokenString))
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));
                
        if (token.getRevoked() || token.getExpiresAt().isBefore(OffsetDateTime.now())) {
            // Token theft detection: if they try to use a revoked token, revoke ALL tokens for safety
            if (token.getRevoked()) {
                refreshTokenRepository.revokeAllUserTokens(token.getUser().getId());
            }
            throw new UnauthorizedException("Invalid or expired refresh token");
        }
        
        // Revoke the old token (Rotation)
        token.setRevoked(true);
        refreshTokenRepository.save(token);
        
        return generateTokens(token.getUser());
    }

    @Transactional
    public void logout(UUID userId, String refreshTokenString) {
        refreshTokenRepository.findByTokenHash(passwordEncoder.encode(refreshTokenString))
            .ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
    }

    @Transactional
    public Map<String, Object> generateTokens(User user) {
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getPhone(), user.getTokenVersion());
        
        // Generate secure random refresh token string
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String refreshTokenString = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
        
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(passwordEncoder.encode(refreshTokenString))
                .expiresAt(OffsetDateTime.now().plusDays(7))
                .build();
                
        refreshTokenRepository.save(refreshToken);
        
        // In real impl, we return refreshTokenString via HttpCookie. Returning both for now to be handled by Controller.
        return Map.of("accessToken", accessToken, "refreshToken", refreshTokenString, "user", user);
    }
}
