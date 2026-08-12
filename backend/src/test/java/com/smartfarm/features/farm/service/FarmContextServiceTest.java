package com.smartfarm.features.farm.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.activity.domain.Activity;
import com.smartfarm.features.activity.domain.ActivityPriority;
import com.smartfarm.features.activity.domain.ActivityStatus;
import com.smartfarm.features.activity.domain.ActivityType;
import com.smartfarm.features.activity.repository.ActivityRepository;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.crop.domain.Crop;
import com.smartfarm.features.crop.repository.CropRepository;
import com.smartfarm.features.farm.domain.Farm;

import com.smartfarm.features.farm.dto.context.FarmContextResponse;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.repository.FieldRepository;
import com.smartfarm.features.finance.domain.FinancialTransaction;
import com.smartfarm.features.finance.repository.FinancialTransactionRepository;
import com.smartfarm.features.inventory.domain.InventoryItem;
import com.smartfarm.features.inventory.repository.InventoryItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentMatchers;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FarmContextServiceTest {

    @Mock
    private FarmRepository farmRepository;
    @Mock
    private FieldRepository fieldRepository;
    @Mock
    private CropRepository cropRepository;
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private InventoryItemRepository inventoryItemRepository;

    @InjectMocks
    private FarmContextService farmContextService;

    private UUID farmId;
    private UUID userId;
    private User owner;
    private Farm farm;

    @BeforeEach
    void setUp() {
        farmId = UUID.randomUUID();
        userId = UUID.randomUUID();
        
        owner = new User();
        owner.setId(userId);
        
        farm = new Farm();
        farm.setId(farmId);
        farm.setOwner(owner);
        farm.setName("Test Farm");
        farm.setTotalArea(BigDecimal.valueOf(100));
        farm.setAreaUnit("Acres");
    }

    @Test
    void getFarmContext_validContext_returnsAggregatedData() {
        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        
        Field field = new Field();
        field.setId(UUID.randomUUID());
        field.setFarm(farm);
        field.setName("Field 1");
        field.setArea(BigDecimal.valueOf(50));
        when(fieldRepository.findAll(ArgumentMatchers.<Specification<Field>>any())).thenReturn(List.of(field));
        
        Crop crop = new Crop();
        crop.setId(UUID.randomUUID());
        crop.setField(field);
        crop.setName("Rice");
        crop.setStatus("active");
        crop.setSowingDate(LocalDate.now().minusDays(10));
        crop.setExpectedHarvestDate(LocalDate.now().plusDays(90));
        when(cropRepository.findAll(ArgumentMatchers.<Specification<Crop>>any()))
            .thenReturn(List.of(crop)) // First call: active crops
            .thenReturn(Collections.emptyList()); // Second call: failed crops
        
        Activity activity = new Activity();
        activity.setId(UUID.randomUUID());
        activity.setFarm(farm);
        activity.setTitle("Watering");
        activity.setActivityType(ActivityType.IRRIGATION);
        activity.setStatus(ActivityStatus.PLANNED);
        activity.setPriority(ActivityPriority.HIGH);
        activity.setScheduledDate(OffsetDateTime.now().minusDays(1)); // Overdue
        when(activityRepository.findAll(ArgumentMatchers.<Specification<Activity>>any())).thenReturn(List.of(activity));
        
        FinancialTransaction txn = new FinancialTransaction();
        txn.setId(UUID.randomUUID());
        txn.setFarm(farm);
        txn.setAmount(BigDecimal.valueOf(1000));
        txn.setTransactionType("EXPENSE");
        txn.setTransactionDate(OffsetDateTime.now());
        when(financialTransactionRepository.findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(farmId)).thenReturn(List.of(txn));
        
        InventoryItem item = new InventoryItem();
        item.setId(UUID.randomUUID());
        item.setName("Fertilizer");
        item.setCurrentQuantity(BigDecimal.valueOf(10));
        item.setMinimumStock(BigDecimal.valueOf(20)); // Low stock
        when(inventoryItemRepository.findByFarmIdAndDeletedFalse(farmId)).thenReturn(List.of(item));

        FarmContextResponse response = farmContextService.getFarmContext(farmId, userId);

        assertNotNull(response);
        assertEquals("Test Farm", response.getFarmProfile().getName());
        assertEquals(1, response.getFields().size());
        assertEquals(1, response.getCropStates().size());
        assertEquals("VEGETATIVE", response.getCropStates().get(0).getCurrentLifecycleStage());
        assertTrue(response.getCropStates().get(0).isCalculatedStage());
        assertEquals(1, response.getRecentActivities().size());
        assertEquals(BigDecimal.valueOf(1000), response.getFinanceSummary().getCurrentMonthExpenses());
        assertEquals(1, response.getInventorySummary().getTotalUniqueItems());
        assertEquals(1, response.getInventorySummary().getLowStockCount());
        
        // Attention items: 1 overdue task, 1 low stock
        assertEquals(2, response.getAttentionItems().size());
        assertTrue(response.getAttentionItems().stream().anyMatch(a -> a.getType().equals("OVERDUE_TASK")));
        assertTrue(response.getAttentionItems().stream().anyMatch(a -> a.getType().equals("LOW_STOCK")));
    }

    @Test
    void getFarmContext_unauthorized_throwsException() {
        User otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        farm.setOwner(otherUser);
        
        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        
        assertThrows(AccessDeniedException.class, () -> farmContextService.getFarmContext(farmId, userId));
    }

    @Test
    void getFarmContext_nonexistentFarm_throwsException() {
        when(farmRepository.findById(farmId)).thenReturn(Optional.empty());
        
        assertThrows(ResourceNotFoundException.class, () -> farmContextService.getFarmContext(farmId, userId));
    }

    @Test
    void getFarmContext_multipleFieldsAndCrops_aggregatesCorrectly() {
        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        
        Field field1 = new Field(); field1.setId(UUID.randomUUID()); field1.setFarm(farm);
        Field field2 = new Field(); field2.setId(UUID.randomUUID()); field2.setFarm(farm);
        when(fieldRepository.findAll(ArgumentMatchers.<Specification<Field>>any())).thenReturn(List.of(field1, field2));
        
        when(cropRepository.findAll(ArgumentMatchers.<Specification<Crop>>any())).thenReturn(Collections.emptyList());
        when(activityRepository.findAll(ArgumentMatchers.<Specification<Activity>>any())).thenReturn(Collections.emptyList());
        when(financialTransactionRepository.findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(farmId)).thenReturn(Collections.emptyList());
        when(inventoryItemRepository.findByFarmIdAndDeletedFalse(farmId)).thenReturn(Collections.emptyList());

        FarmContextResponse response = farmContextService.getFarmContext(farmId, userId);
        
        assertEquals(2, response.getFields().size());
        assertEquals(2, response.getSummary().getFieldCount());
        assertEquals(0, response.getSummary().getActiveCropCount());
    }

    @Test
    void getFarmContext_missingCropDates_returnsUnknownStage() {
        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        
        Field field = new Field(); field.setId(UUID.randomUUID()); field.setFarm(farm);
        when(fieldRepository.findAll(ArgumentMatchers.<Specification<Field>>any())).thenReturn(List.of(field));
        
        Crop crop = new Crop(); crop.setId(UUID.randomUUID()); crop.setField(field); crop.setStatus("active");
        when(cropRepository.findAll(ArgumentMatchers.<Specification<Crop>>any())).thenReturn(List.of(crop));
        
        FarmContextResponse response = farmContextService.getFarmContext(farmId, userId);
        
        assertEquals("UNKNOWN", response.getCropStates().get(0).getCurrentLifecycleStage());
        assertFalse(response.getCropStates().get(0).isCalculatedStage());
    }

    @Test
    void getFarmContext_failedCrop_generatesAttentionItem() {
        when(farmRepository.findById(farmId)).thenReturn(Optional.of(farm));
        when(fieldRepository.findAll(ArgumentMatchers.<Specification<Field>>any())).thenReturn(Collections.emptyList());
        
        // Second call to crop repo in attention items generation
        Crop failedCrop = new Crop();
        failedCrop.setId(UUID.randomUUID());
        failedCrop.setName("Failed Wheat");
        when(cropRepository.findAll(ArgumentMatchers.<Specification<Crop>>any())).thenReturn(List.of(failedCrop));
        
        FarmContextResponse response = farmContextService.getFarmContext(farmId, userId);
        
        boolean hasFailedCrop = response.getAttentionItems().stream()
            .anyMatch(a -> "FAILED_CROP".equals(a.getType()));
        assertTrue(hasFailedCrop);
    }
}
