package com.smartfarm.features.knowledge.storage;

/**
 * Exception thrown when document storage or retrieval operations fail.
 */
public class DocumentStorageException extends RuntimeException {

    public DocumentStorageException(String message) {
        super(message);
    }

    public DocumentStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
