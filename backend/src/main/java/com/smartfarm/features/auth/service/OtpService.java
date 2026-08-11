package com.smartfarm.features.auth.service;

import com.smartfarm.features.auth.domain.OtpToken;
import com.smartfarm.features.auth.repository.OtpTokenRepository;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.Random;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final Random random = new Random();

    @Transactional
    public void generateAndSendOtp(String phone) {
        // Generate 6-digit OTP
        String otpCode = String.format("%06d", random.nextInt(1000000));
        
        OtpToken otpToken = OtpToken.builder()
                .phone(phone)
                .otpHash(passwordEncoder.encode(otpCode))
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .build();
                
        otpTokenRepository.save(otpToken);
        
        // Simulating SMS Provider via Console
        log.info("===========================================");
        log.info("SMS NOTIFICATION - TO: {}", phone);
        log.info("Your Smart Farm code is: {}", otpCode);
        log.info("===========================================");
    }

    @Transactional
    public boolean verifyOtp(String phone, String code) {
        Optional<OtpToken> tokenOpt = otpTokenRepository.findValidOtpByPhone(phone);
        
        if (tokenOpt.isEmpty()) {
            return false;
        }
        
        OtpToken token = tokenOpt.get();
        token.setAttemptCount(token.getAttemptCount() + 1);
        
        if (token.getAttemptCount() > 3) {
            token.setUsed(true); // Invalidated
            otpTokenRepository.save(token);
            return false;
        }
        
        if (passwordEncoder.matches(code, token.getOtpHash())) {
            token.setUsed(true);
            otpTokenRepository.save(token);
            return true;
        }
        
        otpTokenRepository.save(token);
        return false;
    }
}
