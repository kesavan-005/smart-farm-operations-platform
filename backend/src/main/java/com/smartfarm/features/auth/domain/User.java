package com.smartfarm.features.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(unique = true, length = 100)
    private String username;

    @Column(unique = true, nullable = false, length = 20)
    private String phone;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(unique = true, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(length = 50, nullable = false)
    @Builder.Default
    private Role role = Role.WORKER;

    @Column(name = "farm_id")
    private UUID farmId;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    @Column(name = "preferred_language", length = 10)
    @Builder.Default
    private String preferredLanguage = "en";

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = true;

    @Column(name = "token_version", nullable = false)
    @Builder.Default
    private Long tokenVersion = 1L;

    @Column(name = "last_login")
    private OffsetDateTime lastLogin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;
}
