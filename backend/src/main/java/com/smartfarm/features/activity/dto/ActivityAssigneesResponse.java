package com.smartfarm.features.activity.dto;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityAssigneesResponse {

    private List<AssigneeSummary> workers;
    private List<AssigneeSummary> supervisors;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssigneeSummary {
        private UUID id;
        private String name;
        private String role;
        private String phone;
    }
}
