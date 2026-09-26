package com.smartfarm.features.auth.repository;

import com.smartfarm.features.auth.domain.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByPhoneAndDeletedAtIsNull(String phone);
    Optional<User> findByUsernameAndDeletedAtIsNull(String username);
    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.username) = LOWER(:username) AND u.deletedAt IS NULL")
    boolean existsByUsernameAndDeletedAtIsNull(@Param("username") String username);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE LOWER(u.email) = LOWER(:email) AND u.deletedAt IS NULL")
    boolean existsByEmailAndDeletedAtIsNull(@Param("email") String email);

    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.phone = :phone AND u.deletedAt IS NULL")
    boolean existsByPhoneAndDeletedAtIsNull(@Param("phone") String phone);

    @Query("SELECT u FROM User u WHERE (LOWER(u.username) = LOWER(:identifier) OR LOWER(u.email) = LOWER(:identifier) OR u.phone = :identifier) AND u.deletedAt IS NULL")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);
}
