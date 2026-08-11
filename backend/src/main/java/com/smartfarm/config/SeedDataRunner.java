package com.smartfarm.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import java.util.Optional;

@Slf4j
@Component
@Profile("dev")
@RequiredArgsConstructor
public class SeedDataRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.smartfarm.features.farm.repository.FarmRepository farmRepository;
    private final com.smartfarm.features.auth.repository.UserFarmRoleRepository userFarmRoleRepository;

    @Override
    public void run(String... args) {
        log.info("Running dev seed data...");
        
        Optional<User> adminOpt = userRepository.findByEmailAndDeletedAtIsNull("mahechosol2235@gmail.com");
        if (adminOpt.isEmpty()) {
            User admin = User.builder()
                .firstName("Mahesh")
                .lastName("Chosol")
                .name("Mahesh Chosol")
                .username("mahechosol2235")
                .email("mahechosol2235@gmail.com")
                .phone("+919876543210")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(Role.ADMIN)
                .preferredLanguage("en")
                .isActive(true)
                .isVerified(true)
                .build();
            userRepository.save(admin);
            log.info("Seeded default admin user: mahechosol2235@gmail.com / Password@123");
        }

        // Log users
        log.info("=== USERS IN DATABASE ===");
        userRepository.findAll().forEach(u -> log.info("User: ID={}, Name={}, Email={}, Role={}", u.getId(), u.getName(), u.getEmail(), u.getRole()));

        // Log farms
        log.info("=== FARMS IN DATABASE ===");
        farmRepository.findAll().forEach(f -> log.info("Farm: ID={}, Name={}, OwnerID={}", f.getId(), f.getName(), f.getOwner() != null ? f.getOwner().getId() : "null"));

        // Log user-farm roles
        log.info("=== USER_FARM_ROLES IN DATABASE ===");
        userFarmRoleRepository.findAll().forEach(r -> log.info("RoleMapping: ID={}, UserId={}, FarmId={}, Role={}", r.getId(), r.getUser() != null ? r.getUser().getId() : "null", r.getFarmId(), r.getRole()));
    }
}

