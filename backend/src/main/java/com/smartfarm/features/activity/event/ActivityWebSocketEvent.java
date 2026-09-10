package com.smartfarm.features.activity.event;

import com.smartfarm.features.activity.dto.ActivityResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityWebSocketEvent {
    
    public enum EventType {
        CREATED, UPDATED, DELETED
    }

    private EventType eventType;
    
    // For CREATED/UPDATED, payload is the ActivityResponse
    private ActivityResponse activity;
    
    // For DELETED, payload is just ID and farmId
    private UUID activityId;
    private UUID farmId;
}
