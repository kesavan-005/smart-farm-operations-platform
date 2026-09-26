package com.smartfarm.features.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

import com.smartfarm.common.exception.BadRequestException;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.dto.AuthDtos.RegisterRequest;
import com.smartfarm.features.auth.repository.AuditLogRepository;
import com.smartfarm.features.auth.repository.OtpTokenRepository;
import com.smartfarm.features.auth.repository.RefreshTokenRepository;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.security.TokenProvider;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceRegistrationTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private OtpService otpService;

    @Mock
    private TokenProvider tokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.existsByUsernameAndDeletedAtIsNull(anyString())).thenReturn(false);
        when(userRepository.existsByEmailAndDeletedAtIsNull(anyString())).thenReturn(false);
        when(userRepository.existsByPhoneAndDeletedAtIsNull(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            if (u.getId() == null) {
                u.setId(UUID.randomUUID());
            }
            return u;
        });
    }

    private RegisterRequest createBaseRequest() {
        return RegisterRequest.builder()
                .fullName("John Farmer")
                .username("john_farmer")
                .email("farmer@smartfarm.io")
                .phone("9876543210")
                .password("StrongPass1@")
                .confirmPassword("StrongPass1@")
                .language("en")
                .build();
    }

    @Test
    @DisplayName("Registration without role defaults to Role.FARM_OWNER (Farmer)")
    void testRegistration_WithoutRole_AssignsFarmOwner() {
        RegisterRequest request = createBaseRequest();
        request.setRole(null);

        Map<String, Object> result = authService.register(request, "127.0.0.1");

        assertNotNull(result);
        assertEquals("john_farmer", result.get("username"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();

        assertEquals(Role.FARM_OWNER, savedUser.getRole());
    }

    @Test
    @DisplayName("Registration with blank role defaults to Role.FARM_OWNER")
    void testRegistration_WithBlankRole_AssignsFarmOwner() {
        RegisterRequest request = createBaseRequest();
        request.setRole("   ");

        Map<String, Object> result = authService.register(request, "127.0.0.1");

        assertNotNull(result);
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals(Role.FARM_OWNER, userCaptor.getValue().getRole());
    }

    @ParameterizedTest
    @ValueSource(strings = {"FARMER", "farmer", "FARM_OWNER", "farm_owner", "OWNER"})
    @DisplayName("Registration with FARMER or FARM_OWNER assigns Role.FARM_OWNER")
    void testRegistration_WithFarmerRole_AssignsFarmOwner(String roleStr) {
        RegisterRequest request = createBaseRequest();
        request.setRole(roleStr);

        Map<String, Object> result = authService.register(request, "127.0.0.1");

        assertNotNull(result);
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals(Role.FARM_OWNER, userCaptor.getValue().getRole());
    }

    @ParameterizedTest
    @ValueSource(strings = {"ADMIN", "admin", "Admin", " ADMIN "})
    @DisplayName("Registration attempting privileged role ADMIN is rejected with BadRequestException")
    void testRegistration_WithAdminRole_Rejected(String adminRole) {
        RegisterRequest request = createBaseRequest();
        request.setRole(adminRole);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> {
            authService.register(request, "127.0.0.1");
        });

        assertTrue(ex.getMessage().contains("Self-registration for privileged role 'ADMIN' is not allowed"));
        verify(userRepository, never()).save(any(User.class));
    }

    @ParameterizedTest
    @ValueSource(strings = {"WORKER", "VIEWER", "MANAGER", "SUPERVISOR", "CUSTOM_ROLE"})
    @DisplayName("Registration attempting other non-admin roles is normalized safely to Role.FARM_OWNER for public farmer signup")
    void testRegistration_WithOtherRoles_AssignsFarmOwner(String otherRole) {
        RegisterRequest request = createBaseRequest();
        request.setRole(otherRole);

        Map<String, Object> result = authService.register(request, "127.0.0.1");

        assertNotNull(result);
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals(Role.FARM_OWNER, userCaptor.getValue().getRole());
    }

    @Test
    @DisplayName("Existing valid registration with password match and unique fields succeeds")
    void testRegistration_ValidFarmer_Success() {
        RegisterRequest request = createBaseRequest();

        Map<String, Object> result = authService.register(request, "192.168.1.1");

        assertEquals("Registration successful. Please login to continue.", result.get("message"));
        assertEquals("john_farmer", result.get("username"));
        assertEquals("farmer@smartfarm.io", result.get("email"));
        verify(userRepository).save(any(User.class));
    }
}
