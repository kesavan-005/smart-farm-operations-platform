package com.smartfarm.features.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.smartfarm.features.auth.domain.OtpToken;
import com.smartfarm.features.auth.repository.OtpTokenRepository;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

class OtpServiceTest {

    @Mock
    private OtpTokenRepository otpTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private OtpService otpService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void verifyOtp_Success() {
        String phone = "1234567890";
        String code = "123456";
        
        OtpToken token = OtpToken.builder()
                .phone(phone)
                .otpHash("hashedCode")
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .attemptCount(0)
                .used(false)
                .build();
                
        when(otpTokenRepository.findValidOtpByPhone(phone)).thenReturn(Optional.of(token));
        when(passwordEncoder.matches(code, "hashedCode")).thenReturn(true);
        
        boolean result = otpService.verifyOtp(phone, code);
        
        assertTrue(result);
        assertTrue(token.getUsed());
        verify(otpTokenRepository).save(token);
    }

    @Test
    void verifyOtp_TooManyAttempts() {
        String phone = "1234567890";
        String code = "000000";
        
        OtpToken token = OtpToken.builder()
                .phone(phone)
                .otpHash("hashedCode")
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .attemptCount(3) // 4th attempt will fail
                .used(false)
                .build();
                
        when(otpTokenRepository.findValidOtpByPhone(phone)).thenReturn(Optional.of(token));
        
        boolean result = otpService.verifyOtp(phone, code);
        
        assertFalse(result);
        assertTrue(token.getUsed()); // Token is invalidated
        assertEquals(4, token.getAttemptCount());
        verify(otpTokenRepository).save(token);
    }
}
