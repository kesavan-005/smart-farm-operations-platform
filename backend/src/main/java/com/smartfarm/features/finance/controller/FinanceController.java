package com.smartfarm.features.finance.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.finance.dto.*;
import com.smartfarm.features.finance.service.FinanceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/finance")
@RequiredArgsConstructor
public class FinanceController {

    private final FinanceService financeService;

    @PostMapping("/transactions")
    public ResponseEntity<ApiResponse<FinancialTransactionResponse>> recordTransaction(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody FinancialTransactionRequest request,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        FinancialTransactionResponse response = financeService.recordTransaction(farmId, userId, request, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<Page<FinancialTransactionResponse>>> getTransactions(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            Pageable pageable) {
        Page<FinancialTransactionResponse> response = financeService.getTransactions(farmId, userId, type, category, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTransaction(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId,
            HttpServletRequest servletRequest) {
        String ipAddress = servletRequest.getRemoteAddr();
        financeService.deleteTransaction(id, farmId, userId, ipAddress);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/journal")
    public ResponseEntity<ApiResponse<List<JournalEntryResponse>>> getJournalLedger(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        List<JournalEntryResponse> response = financeService.getJournalLedger(farmId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/budgets")
    public ResponseEntity<ApiResponse<FinancialBudgetResponse>> createBudget(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody FinancialBudgetRequest request) {
        FinancialBudgetResponse response = financeService.createBudget(farmId, userId, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/budgets")
    public ResponseEntity<ApiResponse<List<FinancialBudgetResponse>>> getBudgets(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        List<FinancialBudgetResponse> response = financeService.getBudgets(farmId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/budgets/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        financeService.deleteBudget(id, farmId, userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<FinanceDashboardResponse>> getDashboard(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        FinanceDashboardResponse response = financeService.getDashboard(farmId, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
