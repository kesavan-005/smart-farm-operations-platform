package com.smartfarm.features.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfarm.common.api.ApiError;
import com.smartfarm.common.api.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException) throws IOException, ServletException {

        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiError apiError = ApiError.builder()
                .code("FORBIDDEN")
                .message("Access denied: You do not have permission to perform this action")
                .build();

        ApiResponse<Void> apiResponse = ApiResponse.error(apiError);
        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}
