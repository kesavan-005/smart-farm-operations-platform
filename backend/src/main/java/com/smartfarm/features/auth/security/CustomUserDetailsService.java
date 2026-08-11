package com.smartfarm.features.auth.security;

import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.repository.UserRepository;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        String cleanIdentifier = identifier != null ? identifier.trim() : "";
        log.debug("Loading user details for identifier: {}", cleanIdentifier);

        User user = userRepository.findByIdentifier(cleanIdentifier)
                .orElseThrow(() -> {
                    log.warn("UserDetailsService: No user found for identifier '{}'", cleanIdentifier);
                    return new UsernameNotFoundException("User not found with identifier: " + cleanIdentifier);
                });

        if (!user.isActive()) {
            log.warn("UserDetailsService: Account for user '{}' is disabled", user.getUsername());
            throw new DisabledException("User account is disabled");
        }

        String roleName = user.getRole() != null ? user.getRole().name() : "WORKER";

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername() != null ? user.getUsername() : user.getPhone())
                .password(user.getPasswordHash() != null ? user.getPasswordHash() : "")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + roleName)))
                .disabled(!user.isActive())
                .accountExpired(false)
                .credentialsExpired(false)
                .accountLocked(false)
                .build();
    }
}
