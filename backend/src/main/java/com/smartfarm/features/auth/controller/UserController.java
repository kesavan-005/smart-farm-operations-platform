package com.smartfarm.features.auth.controller;

import com.smartfarm.features.auth.dto.UserDtos.UserProfileResponse;
import com.smartfarm.features.auth.dto.UserDtos.UserProfileUpdateRequest;
import com.smartfarm.features.auth.service.UserService;
import com.smartfarm.features.auth.domain.UserFarmRole;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(userService.getUserProfile(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateCurrentUser(
            Authentication authentication,
            @RequestBody UserProfileUpdateRequest request) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(userService.updateUserProfile(userId, request));
    }

    @GetMapping
    public ResponseEntity<List<UserProfileResponse>> listUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/me/roles")
    public ResponseEntity<List<UserFarmRole>> getMyFarmRoles(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(userService.getUserFarmRoles(userId));
    }
}
