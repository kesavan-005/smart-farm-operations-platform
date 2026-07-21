package com.smartfarm.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("dev")
public class SeedDataRunner implements CommandLineRunner {

    @Override
    public void run(String... args) {
        log.info("Running dev seed data...");
        // Entity seed data will be added here as domain models are created in later phases
    }
}
