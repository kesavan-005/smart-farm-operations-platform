package com.smartfarm.features.inventory.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.inventory.domain.Warehouse;
import com.smartfarm.features.inventory.domain.InventoryCategory;
import com.smartfarm.features.inventory.domain.InventoryItem;
import com.smartfarm.features.inventory.domain.StockTransaction;
import com.smartfarm.features.inventory.dto.*;
import com.smartfarm.features.inventory.mapper.InventoryMapper;
import com.smartfarm.features.inventory.repository.WarehouseRepository;
import com.smartfarm.features.inventory.repository.InventoryCategoryRepository;
import com.smartfarm.features.inventory.repository.InventoryItemRepository;
import com.smartfarm.features.inventory.repository.StockTransactionRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final WarehouseRepository warehouseRepository;
    private final InventoryCategoryRepository categoryRepository;
    private final InventoryItemRepository itemRepository;
    private final StockTransactionRepository transactionRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final UserFarmRoleRepository userFarmRoleRepository;
    private final InventoryMapper mapper;
    private final com.smartfarm.features.finance.service.FinanceService financeService;

    // ==========================================
    // Helper Authorization Methods
    // ==========================================

    private void validateFarmAccess(UUID farmId, UUID userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        if (farm.getOwner().getId().equals(userId)) {
            return;
        }
        boolean hasAccess = userFarmRoleRepository.findByUserId(userId).stream()
                .anyMatch(role -> role.getFarmId().equals(farmId));
        if (!hasAccess) {
            throw new AccessDeniedException("Access denied to this farm");
        }
    }

    private void validateFarmWriteAccess(UUID farmId, UUID userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        if (farm.getOwner().getId().equals(userId)) {
            return;
        }
        UserFarmRole farmRole = userFarmRoleRepository.findByUserId(userId).stream()
                .filter(role -> role.getFarmId().equals(farmId))
                .findFirst()
                .orElseThrow(() -> new AccessDeniedException("Access denied to this farm"));
        if (farmRole.getRole() == Role.VIEWER) {
            throw new AccessDeniedException("Viewer role does not have edit permissions");
        }
    }

    // ==========================================
    // Warehouses
    // ==========================================

    @Transactional
    public WarehouseResponse createWarehouse(UUID farmId, WarehouseRequest request, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        Warehouse warehouse = mapper.toEntity(request);
        warehouse.setFarm(farm);
        warehouse = warehouseRepository.save(warehouse);
        return mapper.toResponse(warehouse);
    }

    @Transactional(readOnly = true)
    public List<WarehouseResponse> getWarehouses(UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        return warehouseRepository.findByFarmIdAndDeletedFalse(farmId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WarehouseResponse getWarehouseById(UUID id, UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        if (!warehouse.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Warehouse does not belong to this farm");
        }
        return mapper.toResponse(warehouse);
    }

    @Transactional
    public WarehouseResponse updateWarehouse(UUID id, UUID farmId, WarehouseRequest request, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        if (!warehouse.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Warehouse does not belong to this farm");
        }
        mapper.updateEntity(request, warehouse);
        warehouse = warehouseRepository.save(warehouse);
        return mapper.toResponse(warehouse);
    }

    @Transactional
    public void deleteWarehouse(UUID id, UUID farmId, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        Warehouse warehouse = warehouseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
        if (!warehouse.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Warehouse does not belong to this farm");
        }
        warehouse.setDeleted(true);
        warehouse.setDeletedAt(OffsetDateTime.now());
        warehouseRepository.save(warehouse);
    }

    // ==========================================
    // Categories
    // ==========================================

    @Transactional
    public InventoryCategoryResponse createCategory(UUID farmId, InventoryCategoryRequest request, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        InventoryCategory category = mapper.toEntity(request);
        category.setFarm(farm);
        
        if (request.getParentCategoryId() != null) {
            InventoryCategory parent = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParentCategory(parent);
        }
        
        category = categoryRepository.save(category);
        return mapper.toResponse(category);
    }

    @Transactional(readOnly = true)
    public List<InventoryCategoryResponse> getCategories(UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        return categoryRepository.findByFarmIdAndDeletedFalse(farmId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventoryCategoryResponse getCategoryById(UUID id, UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        InventoryCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!category.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Category does not belong to this farm");
        }
        return mapper.toResponse(category);
    }

    @Transactional
    public InventoryCategoryResponse updateCategory(UUID id, UUID farmId, InventoryCategoryRequest request, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        InventoryCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!category.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Category does not belong to this farm");
        }
        mapper.updateEntity(request, category);
        
        if (request.getParentCategoryId() != null) {
            InventoryCategory parent = categoryRepository.findById(request.getParentCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found"));
            category.setParentCategory(parent);
        } else {
            category.setParentCategory(null);
        }
        
        category = categoryRepository.save(category);
        return mapper.toResponse(category);
    }

    @Transactional
    public void deleteCategory(UUID id, UUID farmId, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        InventoryCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!category.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Category does not belong to this farm");
        }
        category.setDeleted(true);
        category.setDeletedAt(OffsetDateTime.now());
        categoryRepository.save(category);
    }

    // ==========================================
    // Inventory Items
    // ==========================================

    @Transactional
    public InventoryItemResponse createItem(UUID farmId, InventoryItemRequest request, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        
        InventoryItem item = mapper.toEntity(request);
        item.setFarm(farm);

        if (request.getCategoryId() != null) {
            InventoryCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            item.setCategory(category);
        }

        if (request.getWarehouseId() != null) {
            Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
            item.setWarehouse(warehouse);
        }

        if (item.getSku() == null || item.getSku().trim().isEmpty()) {
            item.setSku("SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        item = itemRepository.save(item);
        return mapper.toResponse(item);
    }

    @Transactional(readOnly = true)
    public List<InventoryItemResponse> getItems(UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        return itemRepository.findByFarmIdAndDeletedFalse(farmId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InventoryItemResponse getItemById(UUID id, UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        if (!item.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Item does not belong to this farm");
        }
        return mapper.toResponse(item);
    }

    @Transactional
    public InventoryItemResponse updateItem(UUID id, UUID farmId, InventoryItemRequest request, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        if (!item.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Item does not belong to this farm");
        }
        
        mapper.updateEntity(request, item);

        if (request.getCategoryId() != null) {
            InventoryCategory category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            item.setCategory(category);
        } else {
            item.setCategory(null);
        }

        if (request.getWarehouseId() != null) {
            Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
            item.setWarehouse(warehouse);
        } else {
            item.setWarehouse(null);
        }

        item = itemRepository.save(item);
        return mapper.toResponse(item);
    }

    @Transactional
    public void deleteItem(UUID id, UUID farmId, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        InventoryItem item = itemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        if (!item.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Item does not belong to this farm");
        }
        item.setDeleted(true);
        item.setDeletedAt(OffsetDateTime.now());
        itemRepository.save(item);
    }

    // ==========================================
    // Stock Transactions
    // ==========================================

    @Transactional
    public StockTransactionResponse createTransaction(UUID itemId, UUID farmId, UUID userId, StockTransactionRequest request) {
        validateFarmWriteAccess(farmId, userId);
        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        if (!item.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Item does not belong to this farm");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        BigDecimal currentQuantity = item.getCurrentQuantity();
        BigDecimal txnQuantity = request.getQuantity();

        switch (request.getTransactionType().toUpperCase()) {
            case "PURCHASE":
            case "RETURN":
            case "HARVEST_STORAGE":
                item.setCurrentQuantity(currentQuantity.add(txnQuantity));
                break;
            case "SALE":
            case "USAGE":
            case "WASTE":
                item.setCurrentQuantity(currentQuantity.subtract(txnQuantity));
                break;
            case "TRANSFER":
                item.setCurrentQuantity(currentQuantity.subtract(txnQuantity));
                break;
            case "ADJUSTMENT":
                item.setCurrentQuantity(txnQuantity);
                break;
            default:
                throw new IllegalArgumentException("Unknown transaction type: " + request.getTransactionType());
        }

        itemRepository.save(item);

        StockTransaction transaction = StockTransaction.builder()
                .inventoryItem(item)
                .transactionType(request.getTransactionType().toUpperCase())
                .quantity(txnQuantity)
                .unit(request.getUnit())
                .user(user)
                .reference(request.getReference())
                .notes(request.getNotes())
                .build();

        transaction = transactionRepository.save(transaction);

        // Hook into financial services to record transaction expenses/consumptions automatically
        String type = request.getTransactionType().toUpperCase();
        if ("PURCHASE".equals(type) || "USAGE".equals(type) || "WASTE".equals(type)) {
            try {
                financeService.recordInventoryExpense(farmId, item, txnQuantity, type, userId);
            } catch (Exception e) {
                log.error("Failed to automatically record financial ledger for stock transaction: {}", transaction.getId(), e);
            }
        }

        return mapper.toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public List<StockTransactionResponse> getTransactions(UUID itemId, UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        InventoryItem item = itemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item not found"));
        if (!item.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Item does not belong to this farm");
        }
        return transactionRepository.findByInventoryItemIdOrderByCreatedAtDesc(itemId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }
}
