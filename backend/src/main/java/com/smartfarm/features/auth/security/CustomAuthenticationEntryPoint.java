package com.smartfarm.features.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartfarm.common.api.ApiError;
import com.smartfarm.common.api.ApiResponse;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

@Component
public class CustomAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException) throws IOException, ServletException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ApiError apiError = ApiError.builder()
                .code("UNAUTHORIZED")
                .message("Authentication is required to access this resource: " + authException.getMessage())
                .build();

        ApiResponse<Void> apiResponse = ApiResponse.error(apiError);
        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}
