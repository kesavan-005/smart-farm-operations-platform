package com.smartfarm.features.farm.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.activity.domain.Activity;
import com.smartfarm.features.activity.domain.ActivityStatus;
import com.smartfarm.features.activity.repository.ActivityRepository;
import com.smartfarm.features.crop.domain.Crop;
import com.smartfarm.features.crop.repository.CropRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.dto.context.*;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.field.domain.Field;
import com.smartfarm.features.field.repository.FieldRepository;
import com.smartfarm.features.finance.domain.FinancialTransaction;
import com.smartfarm.features.finance.repository.FinancialTransactionRepository;
import com.smartfarm.features.inventory.domain.InventoryItem;
import com.smartfarm.features.inventory.repository.InventoryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.smartfarm.features.auth.security.FarmAuthorizationService;
import com.smartfarm.features.weather.service.WeatherService;
import com.smartfarm.features.weather.dto.WeatherResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class FarmContextService {

    private final FarmRepository farmRepository;
    private final FieldRepository fieldRepository;
    private final CropRepository cropRepository;
    private final ActivityRepository activityRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final FarmAuthorizationService farmAuthorizationService;
    private final WeatherService weatherService;

    @Transactional(readOnly = true)
    public FarmContextResponse getFarmContext(UUID farmId, UUID userId) {
        // 1. Correct Authorization Boundary
        if (!farmAuthorizationService.hasFarmAccess(userId, farmId)) {
            throw new AccessDeniedException("Access denied to this farm context");
        }

        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        // 1. Profile
        FarmProfile profile = FarmProfile.builder()
                .name(farm.getName())
                .location(String.format("%s, %s, %s", farm.getVillage() != null ? farm.getVillage() : "", farm.getDistrict() != null ? farm.getDistrict() : "", farm.getState() != null ? farm.getState() : ""))
                .totalArea(farm.getTotalArea())
                .areaUnit(farm.getAreaUnit())
                .soilType(farm.getSoilType())
                .irrigationSource(farm.getIrrigationType())
                .build();

        // 2. Fields
        Specification<Field> fieldSpec = (root, query, cb) -> cb.equal(root.get("farm").get("id"), farmId);
        List<Field> fields = fieldRepository.findAll(fieldSpec);

        List<FieldContext> fieldContexts = new ArrayList<>();
        List<CropStateContext> cropStateContexts = new ArrayList<>();
        int activeCropCount = 0;

        for (Field field : fields) {
            // Get active crop for this field
            Specification<Crop> cropSpec = (root, query, cb) -> cb.and(
                    cb.equal(root.get("field").get("id"), field.getId()),
                    cb.equal(root.get("status"), "active")
            );
            List<Crop> activeCrops = cropRepository.findAll(cropSpec);

            Crop activeCrop = activeCrops.isEmpty() ? null : activeCrops.get(0);

            fieldContexts.add(FieldContext.builder()
                    .id(field.getId())
                    .name(field.getName())
                    .area(field.getArea())
                    .areaUnit(field.getAreaUnit())
                    .status(field.getStatus())
                    .activeCropName(activeCrop != null ? activeCrop.getName() : null)
                    .activeCropId(activeCrop != null ? activeCrop.getId() : null)
                    .build());

            for (Crop crop : activeCrops) {
                activeCropCount++;
                cropStateContexts.add(buildCropStateContext(crop));
            }
        }

        // 3. Activities
        Specification<Activity> activitySpec = (root, query, cb) -> cb.equal(root.get("farm").get("id"), farmId);
        List<Activity> activities = activityRepository.findAll(activitySpec);
        
        List<ActivityContext> recentActivities = activities.stream()
                .sorted((a, b) -> b.getScheduledDate().compareTo(a.getScheduledDate()))
                .limit(10)
                .map(a -> ActivityContext.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .activityType(a.getActivityType().name())
                        .status(a.getStatus().name())
                        .priority(a.getPriority().name())
                        .date(a.getScheduledDate())
                        .build())
                .collect(Collectors.toList());

        // 4. Finances
        List<FinancialTransaction> txns = financialTransactionRepository.findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(farmId);
        YearMonth currentMonth = YearMonth.now();
        BigDecimal currentMonthExpenses = txns.stream()
                .filter(t -> t.getTransactionDate() != null)
                .filter(t -> "EXPENSE".equals(t.getTransactionType()))
                .filter(t -> YearMonth.from(t.getTransactionDate()).equals(currentMonth))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        FinanceSummary financeSummary = FinanceSummary.builder()
                .currentMonthExpenses(currentMonthExpenses)
                .currency("INR")
                .build();

        // 5. Inventory
        List<InventoryItem> inventoryItems = inventoryItemRepository.findByFarmIdAndDeletedFalse(farmId);
        int lowStockCount = (int) inventoryItems.stream()
                .filter(i -> i.getCurrentQuantity().compareTo(i.getMinimumStock()) < 0)
                .count();

        InventorySummary inventorySummary = InventorySummary.builder()
                .totalUniqueItems(inventoryItems.size())
                .lowStockCount(lowStockCount)
                .build();

        // 6. Attention Items
        List<AttentionItem> attentionItems = new ArrayList<>();
        
        // 6a. Overdue tasks
        OffsetDateTime now = OffsetDateTime.now();
        activities.stream()
                .filter(a -> a.getStatus() == ActivityStatus.PLANNED || a.getStatus() == ActivityStatus.IN_PROGRESS)
                .filter(a -> a.getScheduledDate() != null && a.getScheduledDate().isBefore(now))
                .forEach(a -> attentionItems.add(AttentionItem.builder()
                        .type("OVERDUE_TASK")
                        .title("Overdue Task: " + a.getTitle())
                        .description("Task was scheduled for " + a.getScheduledDate().toLocalDate())
                        .severity(a.getPriority().name())
                        .relatedEntityId(a.getId().toString())
                        .build()));

        // 6b. Failed crops
        Specification<Crop> failedCropSpec = (root, query, cb) -> cb.and(
            cb.equal(root.get("field").get("farm").get("id"), farmId),
            cb.equal(root.get("status"), "failed")
        );
        List<Crop> failedCrops = cropRepository.findAll(failedCropSpec);
        failedCrops.forEach(c -> attentionItems.add(AttentionItem.builder()
                .type("FAILED_CROP")
                .title("Failed Crop: " + c.getName())
                .description("Crop marked as failed")
                .severity("HIGH")
                .relatedEntityId(c.getId().toString())
                .build()));

        // 6c. Low stock
        inventoryItems.stream()
                .filter(i -> i.getCurrentQuantity().compareTo(i.getMinimumStock()) < 0)
                .forEach(i -> attentionItems.add(AttentionItem.builder()
                        .type("LOW_STOCK")
                        .title("Low Stock: " + i.getName())
                        .description(String.format("Current quantity (%s) is below minimum (%s)", i.getCurrentQuantity(), i.getMinimumStock()))
                        .severity("MEDIUM")
                        .relatedEntityId(i.getId().toString())
                        .build()));

        // 7. Summary
        FarmContextSummary summary = FarmContextSummary.builder()
                .totalFarmArea(farm.getTotalArea())
                .areaUnit(farm.getAreaUnit())
                .fieldCount(fields.size())
                .activeCropCount(activeCropCount)
                .recentActivityCount(recentActivities.size())
                .build();

        // 8. Weather Integration (Graceful Degradation)
        WeatherResponse weather = null;
        try {
            weather = weatherService.getWeatherForAuthorizedFarm(farm);
        } catch (Exception ex) {
            log.warn("Weather integration unavailable for farm {}: {}", farmId, ex.getMessage());
            // Weather is intentionally left null if unavailable, per design rules
        }

        return FarmContextResponse.builder()
                .farmProfile(profile)
                .summary(summary)
                .fields(fieldContexts)
                .cropStates(cropStateContexts)
                .recentActivities(recentActivities)
                .financeSummary(financeSummary)
                .inventorySummary(inventorySummary)
                .attentionItems(attentionItems)
                .weather(weather)
                .build();
    }

    private CropStateContext buildCropStateContext(Crop crop) {
        String stage = "UNKNOWN";
        boolean calculated = false;

        if (crop.getSowingDate() != null && crop.getExpectedHarvestDate() != null) {
            calculated = true;
            LocalDate today = LocalDate.now();
            if (today.isBefore(crop.getSowingDate())) {
                stage = "PRE_SOWING";
            } else if (today.isAfter(crop.getExpectedHarvestDate())) {
                stage = "READY_FOR_HARVEST";
            } else {
                long totalDays = ChronoUnit.DAYS.between(crop.getSowingDate(), crop.getExpectedHarvestDate());
                long daysPassed = ChronoUnit.DAYS.between(crop.getSowingDate(), today);
                double progress = (double) daysPassed / totalDays;
                
                if (progress < 0.3) {
                    stage = "VEGETATIVE";
                } else if (progress < 0.7) {
                    stage = "FLOWERING";
                } else {
                    stage = "MATURITY";
                }
            }
        }

        // If the crop has a specific explicit status like harvested/failed, prefer that (though this query filters active crops, failed crops won't hit here)
        if (!"active".equalsIgnoreCase(crop.getStatus())) {
            stage = crop.getStatus().toUpperCase();
            calculated = false;
        }

        return CropStateContext.builder()
                .id(crop.getId())
                .name(crop.getName())
                .variety(crop.getVariety())
                .sowingDate(crop.getSowingDate())
                .expectedHarvestDate(crop.getExpectedHarvestDate())
                .currentLifecycleStage(stage)
                .isCalculatedStage(calculated)
                .status(crop.getStatus())
                .fieldId(crop.getField().getId())
                .build();
    }
}
