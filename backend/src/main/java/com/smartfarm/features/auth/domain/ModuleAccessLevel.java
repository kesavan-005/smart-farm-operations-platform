package com.smartfarm.features.auth.domain;

public enum ModuleAccessLevel {
    NO_ACCESS(0),
    VIEW_ONLY(1),
    FULL_ACCESS(2);

    private final int rank;

    ModuleAccessLevel(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }

    public boolean satisfies(ModuleAccessLevel required) {
        return this.rank >= required.getRank();
    }
}
