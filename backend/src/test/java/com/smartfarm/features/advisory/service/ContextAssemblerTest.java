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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class ContextAssemblerTest {

    private FarmContextService farmContextService;
    private KnowledgeRetrievalService knowledgeRetrievalService;
    private ContextAssembler contextAssembler;

    private UUID farmId;
    private UUID userId;
    private UUID fieldId;
    private FarmContextResponse farmContextResponse;
    private List<KnowledgeRetrievalResult> mockedRetrievalResults;
    private KnowledgeRetrievalRequest lastRetrievalRequest;

    @BeforeEach
    void setUp() {
        farmId = UUID.randomUUID();
        userId = UUID.randomUUID();
        fieldId = UUID.randomUUID();

        farmContextResponse = FarmContextResponse.builder()
                .fields(new ArrayList<>(List.of(
                        FieldContext.builder().id(fieldId).build()
                )))
                .cropStates(new ArrayList<>(List.of(
                        CropStateContext.builder().fieldId(fieldId).name("Wheat").build()
                )))
                .build();
                
        mockedRetrievalResults = new ArrayList<>();
        lastRetrievalRequest = null;

        farmContextService = new FarmContextService(null, null, null, null, null, null, null, null) {
            @Override
            public FarmContextResponse getFarmContext(UUID fId, UUID uId) {
                if (fId.equals(farmId) && uId.equals(userId)) {
                    return farmContextResponse;
                }
                throw new ResourceNotFoundException("Farm not found");
            }
        };
        
        knowledgeRetrievalService = new KnowledgeRetrievalService(null) {
            @Override
            public List<KnowledgeRetrievalResult> search(KnowledgeRetrievalRequest req) {
                lastRetrievalRequest = req;
                return mockedRetrievalResults;
            }
        };
        
        contextAssembler = new ContextAssembler(farmContextService, knowledgeRetrievalService);
    }

    @Test
    void testAssemble_FarmLevelContext() {
        AdvisoryRequest request = AdvisoryRequest.builder()
                .farmId(farmId)
                .question("How to deal with pests?")
                .build();

        mockedRetrievalResults.add(KnowledgeRetrievalResult.builder().content("Pest control").build());

        AdvisoryContext context = contextAssembler.assemble(request, userId);

        assertNotNull(context);
        assertEquals("How to deal with pests?", context.getQuestion());
        assertEquals(farmContextResponse, context.getFarmContext());
        assertEquals(1, context.getRetrievedKnowledge().size());

        assertNotNull(lastRetrievalRequest);
        assertEquals("How to deal with pests?", lastRetrievalRequest.getQuery());
        assertNull(lastRetrievalRequest.getCrop());
        assertEquals(5, lastRetrievalRequest.getTopK());
    }

    @Test
    void testAssemble_FieldLevelContext_ValidField() {
        AdvisoryRequest request = AdvisoryRequest.builder()
                .farmId(farmId)
                .fieldId(fieldId)
                .question("How to deal with pests?")
                .build();

        AdvisoryContext context = contextAssembler.assemble(request, userId);

        assertNotNull(context);
        assertEquals(1, context.getFarmContext().getFields().size());
        
        assertNotNull(lastRetrievalRequest);
        assertEquals("Wheat", lastRetrievalRequest.getCrop());
    }

    @Test
    void testAssemble_FieldLevelContext_InvalidField() {
        AdvisoryRequest request = AdvisoryRequest.builder()
                .farmId(farmId)
                .fieldId(UUID.randomUUID())
                .question("How to deal with pests?")
                .build();

        assertThrows(ResourceNotFoundException.class, () -> contextAssembler.assemble(request, userId));
        assertNull(lastRetrievalRequest);
    }
}
