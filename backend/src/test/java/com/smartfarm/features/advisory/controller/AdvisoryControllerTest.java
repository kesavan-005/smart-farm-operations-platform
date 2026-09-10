package com.smartfarm.features.advisory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.advisory.dto.AdvisoryResponse;
import com.smartfarm.features.advisory.dto.AdvisorySource;
import com.smartfarm.features.advisory.exception.AdvisoryGenerationException;
import com.smartfarm.features.advisory.service.AdvisoryOrchestrationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import com.smartfarm.common.exception.GlobalExceptionHandler;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;

class AdvisoryControllerTest {

    private MockMvc mockMvc;
    private AdvisoryController advisoryController;
    private AdvisoryOrchestrationService advisoryOrchestrationService;

    private ObjectMapper objectMapper;
    private UUID farmId;
    private UUID userId;
    private AdvisoryRequest request;
    private AdvisoryResponse response;

    private boolean throwAccessDenied;
    private boolean throwAdvisoryGenerationException;
    private AdvisoryRequest capturedRequest;
    private UUID capturedUserId;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        farmId = UUID.randomUUID();
        userId = UUID.randomUUID();

        throwAccessDenied = false;
        throwAdvisoryGenerationException = false;
        capturedRequest = null;
        capturedUserId = null;

        response = AdvisoryResponse.builder()
                .answer("Use NPK.")
                .sources(List.of(AdvisorySource.builder().title("Fertilizer Guide").build()))
                .weatherUsed(false)
                .build();

        advisoryOrchestrationService = new AdvisoryOrchestrationService(null, null, null, null) {
            @Override
            public AdvisoryResponse generateAdvisory(AdvisoryRequest req, UUID uId) {
                capturedRequest = req;
                capturedUserId = uId;
                if (throwAccessDenied) {
                    throw new AccessDeniedException("Access denied");
                }
                if (throwAdvisoryGenerationException) {
                    throw new AdvisoryGenerationException("Provider timeout");
                }
                return response;
            }
        };

        advisoryController = new AdvisoryController(advisoryOrchestrationService);

        mockMvc = MockMvcBuilders.standaloneSetup(advisoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new org.springframework.web.method.support.HandlerMethodArgumentResolver() {
                    @Override
                    public boolean supportsParameter(org.springframework.core.MethodParameter parameter) {
                        return parameter.getParameterType().equals(UUID.class) && parameter.hasParameterAnnotation(org.springframework.security.core.annotation.AuthenticationPrincipal.class);
                    }
                    @Override
                    public Object resolveArgument(org.springframework.core.MethodParameter parameter, org.springframework.web.method.support.ModelAndViewContainer mavContainer, org.springframework.web.context.request.NativeWebRequest webRequest, org.springframework.web.bind.support.WebDataBinderFactory binderFactory) {
                        return userId;
                    }
                })
                .build();

        request = AdvisoryRequest.builder()
                .farmId(farmId)
                .question("What is the best fertilizer?")
                .build();
    }

    @Test
    void generateAdvisory_Success() throws Exception {
        mockMvc.perform(post("/api/v1/farms/{farmId}/advisory", farmId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.answer").value("Use NPK."))
                .andExpect(jsonPath("$.data.sources[0].title").value("Fertilizer Guide"));

        assertEquals(userId, capturedUserId);
        assertEquals(farmId, capturedRequest.getFarmId());
    }

    @Test
    void generateAdvisory_UnauthorizedFarm() throws Exception {
        throwAccessDenied = true;

        mockMvc.perform(post("/api/v1/farms/{farmId}/advisory", farmId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    @Test
    void generateAdvisory_ValidationFailure() throws Exception {
        request.setQuestion(""); // Blank question
        mockMvc.perform(post("/api/v1/farms/{farmId}/advisory", farmId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));

        assertEquals(null, capturedRequest); // service should not be called
    }

    @Test
    void generateAdvisory_AdvisoryGenerationException() throws Exception {
        throwAdvisoryGenerationException = true;

        mockMvc.perform(post("/api/v1/farms/{farmId}/advisory", farmId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error.code").value("SERVICE_UNAVAILABLE"))
                .andExpect(jsonPath("$.error.message").value("The AI advisory service is currently unavailable. Please try again later."));
    }

    @Test
    void generateAdvisory_OverridesBodyFarmIdWithPath() throws Exception {
        UUID bodyFarmId = UUID.randomUUID();
        AdvisoryRequest spoofedRequest = AdvisoryRequest.builder()
                .farmId(bodyFarmId)
                .question("Spoofed ID test")
                .build();

        mockMvc.perform(post("/api/v1/farms/{farmId}/advisory", farmId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(spoofedRequest)))
                .andExpect(status().isOk());

        assertEquals(farmId, capturedRequest.getFarmId());
    }
}
