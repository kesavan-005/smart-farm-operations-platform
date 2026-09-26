package com.smartfarm.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Use the built-in message broker for subscriptions and broadcasting
        // We will route messages to endpoints prefixed with /topic
        config.enableSimpleBroker("/topic");
        
        // Prefix for messages BOUND for @MessageMapping methods (if any)
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint for clients to connect to the STOMP server
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*"); // Allow all origins for the demo. No SockJS to keep it bare STOMP.
    }
}
