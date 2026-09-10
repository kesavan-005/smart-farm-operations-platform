package com.smartfarm.common.exception;

import com.smartfarm.common.api.ApiError;
import com.smartfarm.common.api.ApiResponse;
import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiError apiError = ApiError.builder()
                .code("VALIDATION_ERROR")
                .message("Validation failed")
                .details(errors)
                .build();

        log.warn("Validation error: {}", errors);
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleHttpMessageNotReadableException(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed JSON request or date deserialization error: {}", ex.getMessage());
        ApiError apiError = ApiError.builder()
                .code("BAD_REQUEST")
                .message("Malformed JSON or invalid date format")
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodArgumentTypeMismatchException(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        log.warn("Method argument type mismatch: {}", ex.getMessage());
        ApiError apiError = ApiError.builder()
                .code("BAD_REQUEST")
                .message("Invalid parameter type")
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        ApiError apiError = ApiError.builder()
                .code("RESOURCE_NOT_FOUND")
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(LocationUnavailableException.class)
    public ResponseEntity<ApiResponse<Void>> handleLocationUnavailableException(LocationUnavailableException ex) {
        ApiError apiError = ApiError.builder()
                .code("WEATHER_LOCATION_UNAVAILABLE")
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(BadRequestException ex) {
        ApiError apiError = ApiError.builder()
                .code("BAD_REQUEST")
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorizedException(UnauthorizedException ex) {
        ApiError apiError = ApiError.builder()
                .code("UNAUTHORIZED")
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentialsException(BadCredentialsException ex) {
        ApiError apiError = ApiError.builder()
                .code("UNAUTHORIZED")
                .message("Invalid username, email, phone number or password")
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        log.error("AccessDeniedException thrown!", ex);
        ApiError apiError = ApiError.builder()
                .code("ACCESS_DENIED")
                .message(ex.getMessage())
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(com.smartfarm.features.advisory.exception.AdvisoryGenerationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAdvisoryGenerationException(com.smartfarm.features.advisory.exception.AdvisoryGenerationException ex) {
        log.error("Advisory generation failed: {}", ex.getMessage());
        ApiError apiError = ApiError.builder()
                .code("SERVICE_UNAVAILABLE")
                .message("The AI advisory service is currently unavailable. Please try again later.")
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.SERVICE_UNAVAILABLE);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleAllUncaughtException(Exception ex) {
        log.error("Unknown error occurred", ex);
        ApiError apiError = ApiError.builder()
                .code("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred")
                .build();
        return new ResponseEntity<>(ApiResponse.error(apiError), HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
