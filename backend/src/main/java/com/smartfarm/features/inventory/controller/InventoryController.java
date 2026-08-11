package com.smartfarm.features.inventory.controller;

import com.smartfarm.common.api.ApiResponse;
import com.smartfarm.features.inventory.dto.*;
import com.smartfarm.features.inventory.service.InventoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/farms/{farmId}/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    // ==========================================
    // Warehouses
    // ==========================================

    @PostMapping("/warehouses")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<WarehouseResponse> createWarehouse(
            @PathVariable UUID farmId,
            @Valid @RequestBody WarehouseRequest request,
            @AuthenticationPrincipal UUID userId) {
        WarehouseResponse response = inventoryService.createWarehouse(farmId, request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/warehouses")
    public ApiResponse<List<WarehouseResponse>> getWarehouses(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        List<WarehouseResponse> response = inventoryService.getWarehouses(farmId, userId);
        return ApiResponse.success(response);
    }

    @PutMapping("/warehouses/{id}")
    public ApiResponse<WarehouseResponse> updateWarehouse(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @Valid @RequestBody WarehouseRequest request,
            @AuthenticationPrincipal UUID userId) {
        WarehouseResponse response = inventoryService.updateWarehouse(id, farmId, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/warehouses/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteWarehouse(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        inventoryService.deleteWarehouse(id, farmId, userId);
        return ApiResponse.success(null);
    }

    // ==========================================
    // Categories
    // ==========================================

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InventoryCategoryResponse> createCategory(
            @PathVariable UUID farmId,
            @Valid @RequestBody InventoryCategoryRequest request,
            @AuthenticationPrincipal UUID userId) {
        InventoryCategoryResponse response = inventoryService.createCategory(farmId, request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/categories")
    public ApiResponse<List<InventoryCategoryResponse>> getCategories(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        List<InventoryCategoryResponse> response = inventoryService.getCategories(farmId, userId);
        return ApiResponse.success(response);
    }

    @PutMapping("/categories/{id}")
    public ApiResponse<InventoryCategoryResponse> updateCategory(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @Valid @RequestBody InventoryCategoryRequest request,
            @AuthenticationPrincipal UUID userId) {
        InventoryCategoryResponse response = inventoryService.updateCategory(id, farmId, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteCategory(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        inventoryService.deleteCategory(id, farmId, userId);
        return ApiResponse.success(null);
    }

    // ==========================================
    // Items
    // ==========================================

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InventoryItemResponse> createItem(
            @PathVariable UUID farmId,
            @Valid @RequestBody InventoryItemRequest request,
            @AuthenticationPrincipal UUID userId) {
        InventoryItemResponse response = inventoryService.createItem(farmId, request, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/items")
    public ApiResponse<List<InventoryItemResponse>> getItems(
            @PathVariable UUID farmId,
            @AuthenticationPrincipal UUID userId) {
        List<InventoryItemResponse> response = inventoryService.getItems(farmId, userId);
        return ApiResponse.success(response);
    }

    @GetMapping("/items/{id}")
    public ApiResponse<InventoryItemResponse> getItemById(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        InventoryItemResponse response = inventoryService.getItemById(id, farmId, userId);
        return ApiResponse.success(response);
    }

    @PutMapping("/items/{id}")
    public ApiResponse<InventoryItemResponse> updateItem(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @Valid @RequestBody InventoryItemRequest request,
            @AuthenticationPrincipal UUID userId) {
        InventoryItemResponse response = inventoryService.updateItem(id, farmId, request, userId);
        return ApiResponse.success(response);
    }

    @DeleteMapping("/items/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteItem(
            @PathVariable UUID farmId,
            @PathVariable UUID id,
            @AuthenticationPrincipal UUID userId) {
        inventoryService.deleteItem(id, farmId, userId);
        return ApiResponse.success(null);
    }

    // ==========================================
    // Transactions
    // ==========================================

    @PostMapping("/items/{itemId}/transactions")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<StockTransactionResponse> createTransaction(
            @PathVariable UUID farmId,
            @PathVariable UUID itemId,
            @Valid @RequestBody StockTransactionRequest request,
            @AuthenticationPrincipal UUID userId) {
        StockTransactionResponse response = inventoryService.createTransaction(itemId, farmId, userId, request);
        return ApiResponse.success(response);
    }

    @GetMapping("/items/{itemId}/transactions")
    public ApiResponse<List<StockTransactionResponse>> getTransactions(
            @PathVariable UUID farmId,
            @PathVariable UUID itemId,
            @AuthenticationPrincipal UUID userId) {
        List<StockTransactionResponse> response = inventoryService.getTransactions(itemId, farmId, userId);
        return ApiResponse.success(response);
    }
}
