package com.smartfarm.features.auth.service;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.common.exception.UnauthorizedException;
import com.smartfarm.features.auth.domain.AuditLog;
import com.smartfarm.features.auth.domain.RefreshToken;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.dto.AuthDtos.ChangePasswordRequest;
import com.smartfarm.features.auth.dto.AuthDtos.LoginRequest;
import com.smartfarm.features.auth.dto.AuthDtos.RegisterRequest;
import com.smartfarm.features.auth.dto.AuthDtos.UpdateProfileRequest;
import com.smartfarm.features.auth.dto.AuthDtos.UserProfileResponse;
import com.smartfarm.features.auth.repository.AuditLogRepository;
import com.smartfarm.features.auth.repository.RefreshTokenRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.security.TokenProvider;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AccountExpiredException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final OtpService otpService;
    private final TokenProvider tokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public Map<String, Object> verifyOtpAndLogin(String phone, String code) {
        String cleanPhone = phone != null ? phone.trim() : "";
        if (!otpService.verifyOtp(cleanPhone, code)) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        User user = userRepository.findByPhoneAndDeletedAtIsNull(cleanPhone)
                .orElseThrow(() -> new UnauthorizedException("User not registered with phone: " + cleanPhone));

        return generateTokens(user);
    }

    @Transactional
    public Map<String, Object> register(RegisterRequest request, String ipAddress) {
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        String phone = request.getPhone() != null ? request.getPhone().trim() : "";

        log.info("Processing user registration for username: '{}', email: '{}'", username, email);

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Password and password confirmation do not match");
        }

        if (userRepository.existsByUsernameAndDeletedAtIsNull(username)) {
            throw new BadRequestException("Username '" + username + "' is already taken");
        }

        if (userRepository.existsByEmailAndDeletedAtIsNull(email)) {
            throw new BadRequestException("Email '" + email + "' is already registered");
        }

        if (userRepository.existsByPhoneAndDeletedAtIsNull(phone)) {
            throw new BadRequestException("Phone number '" + phone + "' is already registered");
        }

        Role assignedRole = Role.fromString(request.getRole());
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .firstName(request.getFirstName() != null ? request.getFirstName().trim() : "")
                .lastName(request.getLastName() != null ? request.getLastName().trim() : "")
                .name((request.getFirstName() + " " + request.getLastName()).trim())
                .username(username)
                .email(email)
                .phone(phone)
                .passwordHash(encodedPassword)
                .role(assignedRole)
                .preferredLanguage(request.getLanguage() != null ? request.getLanguage() : "en")
                .isActive(true)
                .isVerified(true)
                .build();

        user = userRepository.save(user);

        logAudit(user.getId(), user.getUsername(), "REGISTER", "User registered successfully with role " + assignedRole, ipAddress);
        log.info("User '{}' (ID: {}) successfully saved into database with BCrypt hash", user.getUsername(), user.getId());

        return Map.of(
                "message", "Registration successful. Please login to continue.",
                "username", user.getUsername(),
                "email", user.getEmail()
        );
    }

    @Transactional
    public Map<String, Object> loginWithPassword(LoginRequest request, String ipAddress) {
        String identifier = request.getUsername() != null ? request.getUsername().trim() : "";
        log.info("Processing authentication for identifier: '{}'", identifier);

        try {
            // 1. Spring Security Authentication via AuthenticationManager
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
            );

            // 2. Fetch authenticated user record
            User user = userRepository.findByIdentifier(identifier)
                    .orElseThrow(() -> new UnauthorizedException("Invalid username, email, phone number or password"));

            // 3. Update last login timestamp
            user.setLastLogin(OffsetDateTime.now());
            userRepository.save(user);

            // 4. Log successful login audit
            logAudit(user.getId(), user.getUsername(), "LOGIN", "Login successful", ipAddress);
            log.info("User '{}' (ID: {}) authenticated successfully", user.getUsername(), user.getId());

            // 5. Generate and return JWT access token, refresh token, and profile payload
            return generateTokens(user);
        } catch (BadCredentialsException ex) {
            log.warn("Login failed for identifier '{}': Bad credentials", identifier);
            logAudit(null, identifier, "FAILED_LOGIN", "Bad credentials", ipAddress);
            throw new UnauthorizedException("Invalid username, email, phone number or password");
        } catch (DisabledException ex) {
            log.warn("Login failed for identifier '{}': Account disabled", identifier);
            logAudit(null, identifier, "FAILED_LOGIN", "Account disabled", ipAddress);
            throw new UnauthorizedException("Account is disabled. Please contact system administrator.");
        } catch (LockedException ex) {
            log.warn("Login failed for identifier '{}': Account locked", identifier);
            logAudit(null, identifier, "FAILED_LOGIN", "Account locked", ipAddress);
            throw new UnauthorizedException("Account is locked. Please contact system administrator.");
        } catch (AccountExpiredException | CredentialsExpiredException ex) {
            log.warn("Login failed for identifier '{}': Credentials or account expired", identifier);
            logAudit(null, identifier, "FAILED_LOGIN", ex.getMessage(), ipAddress);
            throw new UnauthorizedException("Account or credentials have expired.");
        } catch (AuthenticationException ex) {
            log.warn("Login failed for identifier '{}': {}", identifier, ex.getMessage());
            logAudit(null, identifier, "FAILED_LOGIN", ex.getMessage(), ipAddress);
            throw new UnauthorizedException("Invalid username, email, phone number or password");
        }
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<String> permissions = calculateRolePermissions(user.getRole());

        return UserProfileResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().name())
                .farmId(user.getFarmId())
                .avatar(user.getProfilePhotoUrl())
                .language(user.getPreferredLanguage())
                .active(user.isActive())
                .verified(user.isVerified())
                .permissions(permissions)
                .build();
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getFirstName() != null && !request.getFirstName().isBlank()) {
            user.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().isBlank()) {
            user.setLastName(request.getLastName().trim());
        }
        if (user.getFirstName() != null || user.getLastName() != null) {
            user.setName(((user.getFirstName() != null ? user.getFirstName() : "") + " " +
                         (user.getLastName() != null ? user.getLastName() : "")).trim());
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getPreferredLanguage() != null && !request.getPreferredLanguage().isBlank()) {
            user.setPreferredLanguage(request.getPreferredLanguage());
        }

        user = userRepository.save(user);

        logAudit(user.getId(), user.getUsername(), "PROFILE_UPDATE", "Profile updated", ipAddress);
        return getProfile(user.getId());
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request, String ipAddress) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            logAudit(user.getId(), user.getUsername(), "PASSWORD_CHANGE_FAIL", "Invalid old password", ipAddress);
            throw new BadRequestException("Current password is incorrect");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("New password and confirmation do not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        logAudit(user.getId(), user.getUsername(), "PASSWORD_CHANGE", "Password changed successfully", ipAddress);
    }

    @Transactional
    public Map<String, Object> refreshTokens(String refreshTokenString) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(refreshTokenString)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException("Refresh token has expired. Please log in again.");
        }

        User user = refreshToken.getUser();
        String roleStr = user.getRole() != null ? user.getRole().name() : "WORKER";
        String newAccessToken = tokenProvider.generateAccessToken(user.getId(), user.getPhone(), roleStr, user.getTokenVersion());

        return Map.of("accessToken", newAccessToken);
    }

    @Transactional
    public void logout(UUID userId, String refreshTokenString, String ipAddress) {
        if (refreshTokenString != null && !refreshTokenString.isBlank()) {
            refreshTokenRepository.findByTokenHash(refreshTokenString)
                    .ifPresent(token -> {
                        token.setRevoked(true);
                        refreshTokenRepository.save(token);
                    });
        }
        User user = userRepository.findById(userId).orElse(null);
        String username = user != null ? user.getUsername() : "Unknown";
        logAudit(userId, username, "LOGOUT", "User logged out", ipAddress);
    }

    @Transactional
    public Map<String, Object> generateTokens(User user) {
        String roleStr = user.getRole() != null ? user.getRole().name() : "WORKER";
        String accessToken = tokenProvider.generateAccessToken(user.getId(), user.getPhone(), roleStr, user.getTokenVersion());

        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        String refreshTokenString = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(passwordEncoder.encode(refreshTokenString))
                .expiresAt(OffsetDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(refreshToken);

        UserProfileResponse profile = getProfile(user.getId());

        return Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshTokenString,
                "user", profile
        );
    }

    private void logAudit(UUID userId, String username, String action, String details, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .username(username)
                    .action(action)
                    .details(details)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log for action {}: {}", action, e.getMessage());
        }
    }

    private List<String> calculateRolePermissions(Role role) {
        List<String> permissions = new ArrayList<>();
        if (role == null) return permissions;

        switch (role) {
            case ADMIN:
            case FARM_OWNER:
                permissions.addAll(List.of(
                        "FARMS_MANAGE", "FIELDS_MANAGE", "ACTIVITIES_CREATE", "ACTIVITIES_EDIT", "ACTIVITIES_DELETE",
                        "TASKS_CREATE", "TASKS_EDIT", "TASKS_DELETE", "INVENTORY_MANAGE", "FINANCE_MANAGE", "USERS_MANAGE"
                ));
                break;
            case FARM_MANAGER:
                permissions.addAll(List.of(
                        "FARMS_VIEW", "FIELDS_MANAGE", "ACTIVITIES_CREATE", "ACTIVITIES_EDIT",
                        "TASKS_CREATE", "TASKS_EDIT", "INVENTORY_MANAGE", "FINANCE_MANAGE"
                ));
                break;
            case SUPERVISOR:
                permissions.addAll(List.of(
                        "FARMS_VIEW", "FIELDS_VIEW", "ACTIVITIES_CREATE", "ACTIVITIES_EDIT",
                        "TASKS_CREATE", "TASKS_EDIT", "INVENTORY_VIEW"
                ));
                break;
            case WORKER:
                permissions.addAll(List.of(
                        "FARMS_VIEW", "FIELDS_VIEW", "ACTIVITIES_VIEW", "TASKS_VIEW", "TASKS_UPDATE_STATUS"
                ));
                break;
            case VIEWER:
                permissions.addAll(List.of(
                        "FARMS_VIEW", "FIELDS_VIEW", "ACTIVITIES_VIEW", "TASKS_VIEW"
                ));
                break;
        }
        return permissions;
    }
}
