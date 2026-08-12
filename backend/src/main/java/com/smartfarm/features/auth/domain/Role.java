package com.smartfarm.features.auth.domain;

public enum Role {
    FARM_OWNER,
    ADMIN,
    FARM_MANAGER,
    SUPERVISOR,
    WORKER,
    VIEWER;

    public static Role fromString(String value) {
        if (value == null || value.isBlank()) {
            return WORKER;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        switch (normalized) {
            case "OWNER":
            case "FARM_OWNER":
            case "FARMER":
                return FARM_OWNER;
            case "ADMIN":
                return ADMIN;
            case "MANAGER":
            case "FARM_MANAGER":
                return FARM_MANAGER;
            case "SUPERVISOR":
                return SUPERVISOR;
            case "WORKER":
            case "USER":
                return WORKER;
            case "VIEWER":
                return VIEWER;
            default:
                try {
                    return Role.valueOf(normalized);
                } catch (IllegalArgumentException e) {
                    return WORKER;
                }
        }
    }
}
