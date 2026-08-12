package com.smartfarm.features.inventory.mapper;

import com.smartfarm.features.inventory.domain.Warehouse;
import com.smartfarm.features.inventory.domain.InventoryCategory;
import com.smartfarm.features.inventory.domain.InventoryItem;
import com.smartfarm.features.inventory.domain.StockTransaction;
import com.smartfarm.features.inventory.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface InventoryMapper {

    // Warehouse
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Warehouse toEntity(WarehouseRequest request);

    @Mapping(target = "farmId", source = "farm.id")
    WarehouseResponse toResponse(Warehouse entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(WarehouseRequest request, @MappingTarget Warehouse entity);

    // InventoryCategory
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "parentCategory", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    InventoryCategory toEntity(InventoryCategoryRequest request);

    @Mapping(target = "farmId", source = "farm.id")
    @Mapping(target = "parentCategoryId", source = "parentCategory.id")
    InventoryCategoryResponse toResponse(InventoryCategory entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "parentCategory", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(InventoryCategoryRequest request, @MappingTarget InventoryCategory entity);

    // InventoryItem
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "warehouse", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    InventoryItem toEntity(InventoryItemRequest request);

    @Mapping(target = "farmId", source = "farm.id")
    @Mapping(target = "category", source = "category")
    @Mapping(target = "warehouse", source = "warehouse")
    InventoryItemResponse toResponse(InventoryItem entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "category", ignore = true)
    @Mapping(target = "warehouse", ignore = true)
    @Mapping(target = "deleted", ignore = true)
    @Mapping(target = "deletedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(InventoryItemRequest request, @MappingTarget InventoryItem entity);

    // StockTransaction
    @Mapping(target = "inventoryItemId", source = "inventoryItem.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "userName", source = "user.name")
    StockTransactionResponse toResponse(StockTransaction entity);
}
