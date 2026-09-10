package com.smartfarm.features.advisory.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.advisory.dto.AdvisoryContext;
import com.smartfarm.features.advisory.dto.AdvisoryRequest;
import com.smartfarm.features.farm.dto.context.CropStateContext;
import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.farm.dto.context.FieldContext;
import com.smartfarm.features.farm.service.FarmContextService;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeRetrievalResult;
import com.smartfarm.features.knowledge.service.KnowledgeRetrievalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContextAssembler {

    private final FarmContextService farmContextService;
    private final KnowledgeRetrievalService knowledgeRetrievalService;

    public AdvisoryContext assemble(AdvisoryRequest request, UUID userId) {
        // 1. Obtain authorized farm context
        FarmContextResponse farmContext = farmContextService.getFarmContext(request.getFarmId(), userId);

        // 2. Handle field-specific context filtering if fieldId is provided
        String dominantCrop = null;
        if (request.getFieldId() != null) {
            boolean fieldExists = farmContext.getFields().stream()
                    .anyMatch(f -> f.getId().equals(request.getFieldId()));
            if (!fieldExists) {
                throw new ResourceNotFoundException("Field " + request.getFieldId() + " does not belong to farm " + request.getFarmId());
            }

            // Filter out other fields and crops
            farmContext.setFields(farmContext.getFields().stream()
                    .filter(f -> f.getId().equals(request.getFieldId()))
                    .collect(Collectors.toList()));
            farmContext.setCropStates(farmContext.getCropStates().stream()
                    .filter(c -> c.getFieldId().equals(request.getFieldId()))
                    .collect(Collectors.toList()));

            // Determine if there is exactly one known active crop for this field
            if (farmContext.getCropStates().size() == 1) {
                dominantCrop = farmContext.getCropStates().get(0).getName();
            }
        }

        // 3. Construct semantic retrieval request
        KnowledgeRetrievalRequest retrievalRequest = KnowledgeRetrievalRequest.builder()
                .query(request.getQuestion())
                .topK(5) // Default safe value
                .build();

        // 4. Apply optional crop filter only if reliably available (e.g. from field context)
        if (dominantCrop != null && !dominantCrop.isBlank()) {
            retrievalRequest.setCrop(dominantCrop);
        }

        // 5. Retrieve semantic knowledge
        List<KnowledgeRetrievalResult> retrievalResults = knowledgeRetrievalService.search(retrievalRequest);

        // 6. Return bounded context
        return AdvisoryContext.builder()
                .question(request.getQuestion())
                .farmContext(farmContext)
                .retrievedKnowledge(retrievalResults)
                .build();
    }
}
