package com.smartfarm.features.knowledge.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentDetailDto;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentFilter;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentSummaryDto;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentUploadRequest;
import com.smartfarm.features.knowledge.dto.KnowledgeDocumentUploadResponse;
import com.smartfarm.features.knowledge.dto.KnowledgeHealthReportDto;
import com.smartfarm.features.knowledge.service.KnowledgeHealthService;
import com.smartfarm.features.knowledge.service.KnowledgeManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Administrative REST controller for agricultural knowledge lifecycle management,
 * search, metadata inspection, and diagnostic health monitoring.
 */
@RestController
@RequestMapping("/api/v1/knowledge")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Knowledge Management", description = "Authoritative agricultural knowledge lifecycle and repository management")
public class KnowledgeManagementController {

    private final KnowledgeManagementService managementService;
    private final KnowledgeHealthService healthService;

    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload and ingest an authoritative global agricultural knowledge document")
    public ApiResponse<KnowledgeDocumentUploadResponse> uploadDocument(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @ModelAttribute @Valid KnowledgeDocumentUploadRequest request) {
        if (file != null) {
            request.setFile(file);
        }
        KnowledgeDocumentUploadResponse response = managementService.uploadDocument(request);
        return ApiResponse.success(response);
    }

    @GetMapping
    @Operation(summary = "List and filter agricultural knowledge documents")
    public ApiResponse<Page<KnowledgeDocumentSummaryDto>> listDocuments(
            KnowledgeDocumentFilter filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(managementService.listDocuments(filter, pageable));
    }

    @GetMapping("/{documentId}")
    @Operation(summary = "Get detailed metadata, storage state, and vector indexing status for a document")
    public ApiResponse<KnowledgeDocumentDetailDto> getDocumentDetails(@PathVariable UUID documentId) {
        return ApiResponse.success(managementService.getDocumentDetails(documentId));
    }

    @GetMapping("/search")
    @Operation(summary = "Search knowledge documents by free-text query and filters")
    public ApiResponse<Page<KnowledgeDocumentSummaryDto>> searchDocuments(
            @RequestParam(required = false) String q,
            KnowledgeDocumentFilter filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.success(managementService.searchDocuments(q, filter, pageable));
    }

    @PostMapping("/{documentId}/activate")
    @Operation(summary = "Safely activate a knowledge document for RAG retrieval after safety verification")
    public ApiResponse<KnowledgeDocumentDetailDto> activateDocument(@PathVariable UUID documentId) {
        return ApiResponse.success(managementService.activateDocument(documentId));
    }

    @PostMapping("/{documentId}/archive")
    @Operation(summary = "Safely archive a knowledge document, preserving history while excluding from RAG retrieval")
    public ApiResponse<KnowledgeDocumentDetailDto> archiveDocument(@PathVariable UUID documentId) {
        return ApiResponse.success(managementService.archiveDocument(documentId));
    }

    @PostMapping("/{documentId}/index")
    @Operation(summary = "Index or synchronize vector embeddings for a document's chunks in PgVectorStore")
    public ApiResponse<KnowledgeDocumentDetailDto> indexDocument(@PathVariable UUID documentId) {
        managementService.indexDocumentVectors(documentId);
        return ApiResponse.success(managementService.getDocumentDetails(documentId));
    }

    @GetMapping("/health")
    @Operation(summary = "Generate diagnostic health report of the agricultural knowledge repository")
    public ApiResponse<KnowledgeHealthReportDto> getHealthReport() {
        return ApiResponse.success(healthService.generateHealthReport());
    }
}
