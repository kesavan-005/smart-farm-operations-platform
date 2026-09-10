package com.smartfarm.features.activity.event;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityWebSocketListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleActivityEvent(ActivityWebSocketEvent event) {
        UUID farmId = event.getEventType() == ActivityWebSocketEvent.EventType.DELETED ? 
                      event.getFarmId() : event.getActivity().getFarmId();
                      
        if (farmId == null) {
            log.warn("Activity event missing farmId, cannot broadcast to topic.");
            return;
        }

        String destination = "/topic/farm/" + farmId + "/activities";
        log.debug("Broadcasting {} event to {}", event.getEventType(), destination);
        
        messagingTemplate.convertAndSend(destination, event);
    }
}
