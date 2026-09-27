package com.smartfarm.features.knowledge.exception;

import com.smartfarm.common.exception.BadRequestException;

public class KnowledgeLifecycleException extends BadRequestException {
    public KnowledgeLifecycleException(String message) {
        super(message);
    }
}
