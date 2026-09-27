package com.smartfarm.features.knowledge.extractor;

/**
 * Exception thrown when text extraction from an agricultural document fails
 * or when an unsupported or corrupt format is encountered.
 */
public class DocumentExtractionException extends RuntimeException {

    public DocumentExtractionException(String message) {
        super(message);
    }

    public DocumentExtractionException(String message, Throwable cause) {
        super(message, cause);
    }
}
