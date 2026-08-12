package com.smartfarm.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class LocationUnavailableException extends RuntimeException {
    public LocationUnavailableException(String message) {
        super(message);
    }
}
