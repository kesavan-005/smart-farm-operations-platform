package com.smartfarm.features.activity.event;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityEventPublisher {

    private final ApplicationEventPublisher applicationEventPublisher;

    public void publishEvent(ActivityWebSocketEvent event) {
        log.debug("Publishing Activity event: {}", event.getEventType());
        applicationEventPublisher.publishEvent(event);
    }
}
