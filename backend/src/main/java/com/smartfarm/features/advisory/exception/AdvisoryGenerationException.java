package com.smartfarm.features.advisory.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.SERVICE_UNAVAILABLE)
public class AdvisoryGenerationException extends RuntimeException {
    public AdvisoryGenerationException(String message) {
        super(message);
    }

    public AdvisoryGenerationException(String message, Throwable cause) {
        super(message, cause);
    }
}
