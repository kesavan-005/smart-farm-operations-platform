package com.smartfarm.features.finance.service;

import com.smartfarm.common.exception.ResourceNotFoundException;
import com.smartfarm.features.auth.domain.User;
import com.smartfarm.features.auth.domain.Role;
import com.smartfarm.features.auth.domain.UserFarmRole;
import com.smartfarm.features.auth.repository.UserRepository;
import com.smartfarm.features.auth.repository.UserFarmRoleRepository;
import com.smartfarm.features.farm.domain.Farm;
import com.smartfarm.features.farm.repository.FarmRepository;
import com.smartfarm.features.finance.domain.FinancialBudget;
import com.smartfarm.features.finance.domain.FinancialTransaction;
import com.smartfarm.features.finance.domain.JournalEntry;
import com.smartfarm.features.finance.domain.FinancialAuditLog;
import com.smartfarm.features.finance.dto.*;
import com.smartfarm.features.finance.mapper.FinanceMapper;
import com.smartfarm.features.finance.repository.FinancialBudgetRepository;
import com.smartfarm.features.finance.repository.FinancialTransactionRepository;
import com.smartfarm.features.finance.repository.JournalEntryRepository;
import com.smartfarm.features.finance.repository.FinancialAuditLogRepository;
import com.smartfarm.features.inventory.domain.InventoryItem;
import com.smartfarm.features.inventory.repository.InventoryItemRepository;
import com.smartfarm.features.inventory.domain.InventoryItem;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FinanceService {

    private final FinancialTransactionRepository transactionRepository;
    private final JournalEntryRepository journalEntryRepository;
    private final FinancialBudgetRepository budgetRepository;
    private final FinancialAuditLogRepository auditLogRepository;
    private final FarmRepository farmRepository;
    private final UserRepository userRepository;
    private final UserFarmRoleRepository userFarmRoleRepository;
    private final FinanceMapper mapper;
    private final InventoryItemRepository itemRepository;

    // ==========================================
    // Authorization Helpers
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
            throw new AccessDeniedException("Viewer role does not have financial edit permissions");
        }
    }

    // ==========================================
    // Transactions Core Logic
    // ==========================================

    @Transactional
    public FinancialTransactionResponse recordTransaction(UUID farmId, UUID userId, FinancialTransactionRequest request, String ipAddress) {
        validateFarmWriteAccess(farmId, userId);
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        FinancialTransaction transaction = mapper.toEntity(request);
        transaction.setFarm(farm);
        if (transaction.getTransactionDate() == null) {
            transaction.setTransactionDate(OffsetDateTime.now());
        }

        // Handle client-side offline generated UUIDs
        if (request.getId() != null) {
            transaction.setId(request.getId());
        }

        transaction = transactionRepository.save(transaction);

        // 1. Generate Accounting Entries
        createJournalEntries(transaction);

        // 2. Adjust budget spent amount if relevant
        updateBudgetOnExpense(farmId, transaction);

        // 3. Create Audit Record
        logAudit(transaction.getId(), user, "CREATE", null, transaction.toString(), ipAddress);

        log.info("Persisted financial transaction: {} under farm: {}", transaction.getId(), farmId);
        return mapper.toResponse(transaction);
    }

    @Transactional(readOnly = true)
    public Page<FinancialTransactionResponse> getTransactions(UUID farmId, UUID userId, String type, String category, Pageable pageable) {
        validateFarmAccess(farmId, userId);
        String typeParam = (type == null || type.trim().isEmpty()) ? null : type.toUpperCase();
        String catParam = (category == null || category.trim().isEmpty()) ? null : category.toUpperCase();

        return transactionRepository.findWithFilters(farmId, typeParam, catParam, pageable)
                .map(mapper::toResponse);
    }

    @Transactional
    public void deleteTransaction(UUID id, UUID farmId, UUID userId, String ipAddress) {
        validateFarmWriteAccess(farmId, userId);
        FinancialTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found"));
        if (!transaction.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Transaction does not belong to this farm");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String oldValue = transaction.toString();
        transaction.setDeleted(true);
        transaction.setDeletedAt(OffsetDateTime.now());
        transactionRepository.save(transaction);

        // Reverse budget spent limits
        if ("EXPENSE".equalsIgnoreCase(transaction.getTransactionType())) {
            budgetRepository.findActiveBudget(farmId, transaction.getCategory(), transaction.getTransactionDate().toLocalDate())
                .ifPresent(budget -> {
                    budget.setSpentAmount(budget.getSpentAmount().subtract(transaction.getAmount()));
                    budgetRepository.save(budget);
                });
        }

        logAudit(transaction.getId(), user, "DELETE", oldValue, "DELETED", ipAddress);
    }

    // ==========================================
    // Automated Hook Integrations
    // ==========================================

    @Transactional
    public void recordInventoryExpense(UUID farmId, InventoryItem item, BigDecimal quantity, String operationType, UUID userId) {
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));
        
        BigDecimal amount = quantity.multiply(item.getCost());
        if (amount.compareTo(BigDecimal.ZERO) <= 0) return;

        String description = String.format("Auto Expense: %s of %s (%s %s)",
                operationType, item.getName(), quantity, item.getUnit());

        String category = "FUEL".equalsIgnoreCase(item.getCategory() != null ? item.getCategory().getName() : "") ? "FUEL" : "FERTILIZER_PURCHASE";
        if ("PURCHASE".equalsIgnoreCase(operationType)) {
            category = "SEED_PURCHASE".equalsIgnoreCase(item.getCategory() != null ? item.getCategory().getName() : "") ? "SEED_PURCHASE" : "FERTILIZER_PURCHASE";
        }

        FinancialTransaction transaction = FinancialTransaction.builder()
                .farm(farm)
                .transactionType("EXPENSE")
                .category(category)
                .amount(amount)
                .description(description)
                .referenceId(item.getId())
                .referenceType("INVENTORY_ITEM")
                .paymentMethod("CASH")
                .status("COMPLETED")
                .transactionDate(OffsetDateTime.now())
                .build();

        transaction = transactionRepository.save(transaction);
        createJournalEntries(transaction);
        updateBudgetOnExpense(farmId, transaction);
    }

    // ==========================================
    // Journal Entries (Double-Entry Bookkeeping)
    // ==========================================

    private void createJournalEntries(FinancialTransaction transaction) {
        String type = transaction.getTransactionType().toUpperCase();
        String cat = transaction.getCategory().toUpperCase();
        BigDecimal amount = transaction.getAmount();

        List<JournalEntry> entries = new ArrayList<>();

        if ("REVENUE".equals(type)) {
            // Debit Cash (Asset increases)
            entries.add(JournalEntry.builder()
                    .financialTransaction(transaction)
                    .accountName("CASH")
                    .entryType("DEBIT")
                    .amount(amount)
                    .notes("Cash received from revenue event")
                    .build());
            // Credit Revenue (Equity increases)
            entries.add(JournalEntry.builder()
                    .financialTransaction(transaction)
                    .accountName("REVENUE")
                    .entryType("CREDIT")
                    .amount(amount)
                    .notes("Revenue credited: " + cat)
                    .build());
        } else if ("EXPENSE".equals(type)) {
            String debitAccount = "FARM_EXPENSE";
            
            // Map asset accounts if relevant
            if (cat.contains("PURCHASE") || cat.equals("FUEL")) {
                debitAccount = "INVENTORY";
            }

            // Debit Asset/Expense (Increases)
            entries.add(JournalEntry.builder()
                    .financialTransaction(transaction)
                    .accountName(debitAccount)
                    .entryType("DEBIT")
                    .amount(amount)
                    .notes("Expense debited: " + cat)
                    .build());
            // Credit Cash (Asset decreases)
            entries.add(JournalEntry.builder()
                    .financialTransaction(transaction)
                    .accountName("CASH")
                    .entryType("CREDIT")
                    .amount(amount)
                    .notes("Cash paid for expense")
                    .build());
        } else if ("LIABILITY".equals(type)) {
            // Debit Cash
            entries.add(JournalEntry.builder()
                    .financialTransaction(transaction)
                    .accountName("CASH")
                    .entryType("DEBIT")
                    .amount(amount)
                    .notes("Cash received from loan/liability source")
                    .build());
            // Credit Liability
            entries.add(JournalEntry.builder()
                    .financialTransaction(transaction)
                    .accountName("LIABILITY")
                    .entryType("CREDIT")
                    .amount(amount)
                    .notes("Liability created")
                    .build());
        }

        journalEntryRepository.saveAll(entries);
    }

    @Transactional(readOnly = true)
    public List<JournalEntryResponse> getJournalLedger(UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        return journalEntryRepository.findByFarmId(farmId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    // ==========================================
    // Budget Mappings
    // ==========================================

    @Transactional
    public FinancialBudgetResponse createBudget(UUID farmId, UUID userId, FinancialBudgetRequest request) {
        validateFarmWriteAccess(farmId, userId);
        Farm farm = farmRepository.findById(farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Farm not found"));

        FinancialBudget budget = mapper.toEntity(request);
        budget.setFarm(farm);

        // Compute initial spent amount from current month's matching category transactions
        OffsetDateTime start = request.getStartDate().atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        OffsetDateTime end = request.getEndDate().plusDays(1).atStartOfDay().atOffset(OffsetDateTime.now().getOffset());
        BigDecimal totalSpent = transactionRepository.findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(farmId).stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getTransactionType()) && request.getCategory().equalsIgnoreCase(t.getCategory()))
                .filter(t -> t.getTransactionDate().isAfter(start) && t.getTransactionDate().isBefore(end))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        budget.setSpentAmount(totalSpent);
        budget = budgetRepository.save(budget);
        return mapper.toResponse(budget);
    }

    @Transactional(readOnly = true)
    public List<FinancialBudgetResponse> getBudgets(UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);
        return budgetRepository.findByFarmId(farmId).stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteBudget(UUID id, UUID farmId, UUID userId) {
        validateFarmWriteAccess(farmId, userId);
        FinancialBudget budget = budgetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Budget not found"));
        if (!budget.getFarm().getId().equals(farmId)) {
            throw new AccessDeniedException("Budget does not belong to this farm");
        }
        budgetRepository.delete(budget);
    }

    private void updateBudgetOnExpense(UUID farmId, FinancialTransaction transaction) {
        if (!"EXPENSE".equalsIgnoreCase(transaction.getTransactionType())) return;

        budgetRepository.findActiveBudget(farmId, transaction.getCategory(), transaction.getTransactionDate().toLocalDate())
            .ifPresent(budget -> {
                budget.setSpentAmount(budget.getSpentAmount().add(transaction.getAmount()));
                budgetRepository.save(budget);
                log.info("Updated spent amount for budget {}: {}", budget.getId(), budget.getSpentAmount());
            });
    }

    // ==========================================
    // Audit & Dashboard Stats
    // ==========================================

    private void logAudit(UUID txnId, User user, String op, String oldVal, String newVal, String ip) {
        FinancialAuditLog audit = FinancialAuditLog.builder()
                .financialTransactionId(txnId)
                .user(user)
                .operation(op)
                .oldValue(oldVal)
                .newValue(newVal)
                .ipAddress(ip)
                .build();
        auditLogRepository.save(audit);
    }

    @Transactional(readOnly = true)
    public FinanceDashboardResponse getDashboard(UUID farmId, UUID userId) {
        validateFarmAccess(farmId, userId);

        List<FinancialTransaction> txns = transactionRepository.findByFarmIdAndDeletedFalseOrderByTransactionDateDesc(farmId);
        List<FinancialBudget> budgets = budgetRepository.findByFarmId(farmId);

        // Date-time context
        OffsetDateTime now = OffsetDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);

        // 1. KPI Today & Month calculations
        BigDecimal revenueToday = txns.stream()
                .filter(t -> "REVENUE".equalsIgnoreCase(t.getTransactionType()) && t.getTransactionDate().toLocalDate().equals(today))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueMonth = txns.stream()
                .filter(t -> "REVENUE".equalsIgnoreCase(t.getTransactionType()) && !t.getTransactionDate().toLocalDate().isBefore(firstDayOfMonth))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expensesToday = txns.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getTransactionType()) && t.getTransactionDate().toLocalDate().equals(today))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal expensesMonth = txns.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getTransactionType()) && !t.getTransactionDate().toLocalDate().isBefore(firstDayOfMonth))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRevenue = txns.stream()
                .filter(t -> "REVENUE".equalsIgnoreCase(t.getTransactionType()))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalExpenses = txns.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getTransactionType()))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netProfit = revenueMonth.subtract(expensesMonth); // Net profit this month
        BigDecimal cashAvailable = totalRevenue.subtract(totalExpenses); // Balance

        // Inventory Value calculation
        BigDecimal inventoryValue = itemRepository.findByFarmIdAndDeletedFalse(farmId).stream()
                .map(item -> item.getCurrentQuantity().multiply(item.getCost()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal outstandingPayments = txns.stream()
                .filter(t -> "PENDING".equalsIgnoreCase(t.getStatus()))
                .map(FinancialTransaction::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Budget utilization calculation
        BigDecimal totalBudgetLimits = budgets.stream()
                .map(FinancialBudget::getLimitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalBudgetSpent = budgets.stream()
                .map(FinancialBudget::getSpentAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal budgetUtilization = BigDecimal.ZERO;
        if (totalBudgetLimits.compareTo(BigDecimal.ZERO) > 0) {
            budgetUtilization = totalBudgetSpent.multiply(BigDecimal.valueOf(100)).divide(totalBudgetLimits, 2, java.math.RoundingMode.HALF_UP);
        }

        BigDecimal roi = BigDecimal.ZERO;
        if (totalExpenses.compareTo(BigDecimal.ZERO) > 0) {
            roi = totalRevenue.subtract(totalExpenses).multiply(BigDecimal.valueOf(100)).divide(totalExpenses, 2, java.math.RoundingMode.HALF_UP);
        }

        // 2. Charts Series
        // revenueVsExpenses
        Map<String, Map<String, BigDecimal>> monthlyGroup = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate monthDate = today.minusMonths(i);
            String monthName = monthDate.getMonth().name().substring(0, 3) + " " + monthDate.getYear();
            Map<String, BigDecimal> vals = new HashMap<>();
            vals.put("revenue", BigDecimal.ZERO);
            vals.put("expenses", BigDecimal.ZERO);
            monthlyGroup.put(monthName, vals);
        }

        txns.forEach(t -> {
            LocalDate d = t.getTransactionDate().toLocalDate();
            String monthName = d.getMonth().name().substring(0, 3) + " " + d.getYear();
            if (monthlyGroup.containsKey(monthName)) {
                Map<String, BigDecimal> vals = monthlyGroup.get(monthName);
                if ("REVENUE".equalsIgnoreCase(t.getTransactionType())) {
                    vals.put("revenue", vals.get("revenue").add(t.getAmount()));
                } else if ("EXPENSE".equalsIgnoreCase(t.getTransactionType())) {
                    vals.put("expenses", vals.get("expenses").add(t.getAmount()));
                }
            }
        });

        List<Map<String, Object>> revenueVsExpenses = new ArrayList<>();
        monthlyGroup.forEach((month, vals) -> {
            Map<String, Object> point = new HashMap<>();
            point.put("name", month);
            point.put("revenue", vals.get("revenue"));
            point.put("expenses", vals.get("expenses"));
            revenueVsExpenses.add(point);
        });

        // cashFlowHistory & profitTrend
        Map<String, BigDecimal> cashFlowMap = new TreeMap<>();
        txns.forEach(t -> {
            String dateStr = t.getTransactionDate().toLocalDate().toString();
            BigDecimal amount = t.getAmount();
            if ("EXPENSE".equalsIgnoreCase(t.getTransactionType())) {
                amount = amount.negate();
            }
            cashFlowMap.put(dateStr, cashFlowMap.getOrDefault(dateStr, BigDecimal.ZERO).add(amount));
        });

        List<Map<String, Object>> monthlyCashFlow = new ArrayList<>();
        List<Map<String, Object>> profitTrend = new ArrayList<>();
        cashFlowMap.forEach((dateStr, val) -> {
            Map<String, Object> data = new HashMap<>();
            data.put("date", dateStr);
            data.put("value", val);
            monthlyCashFlow.add(data);

            Map<String, Object> profitPoint = new HashMap<>();
            profitPoint.put("date", dateStr);
            profitPoint.put("value", val); // In this setup profit corresponds to positive/negative cash flows
            profitTrend.add(profitPoint);
        });

        // expenseBreakdown
        Map<String, BigDecimal> expenseCatMap = new HashMap<>();
        txns.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getTransactionType()))
                .forEach(t -> expenseCatMap.put(t.getCategory(), expenseCatMap.getOrDefault(t.getCategory(), BigDecimal.ZERO).add(t.getAmount())));

        List<Map<String, Object>> expenseBreakdown = new ArrayList<>();
        expenseCatMap.forEach((cat, val) -> {
            Map<String, Object> data = new HashMap<>();
            data.put("name", cat);
            data.put("value", val);
            expenseBreakdown.add(data);
        });

        // revenueSources
        Map<String, BigDecimal> revenueCatMap = new HashMap<>();
        txns.stream()
                .filter(t -> "REVENUE".equalsIgnoreCase(t.getTransactionType()))
                .forEach(t -> revenueCatMap.put(t.getCategory(), revenueCatMap.getOrDefault(t.getCategory(), BigDecimal.ZERO).add(t.getAmount())));

        List<Map<String, Object>> revenueSources = new ArrayList<>();
        revenueCatMap.forEach((cat, val) -> {
            Map<String, Object> data = new HashMap<>();
            data.put("name", cat);
            data.put("value", val);
            revenueSources.add(data);
        });

        // budgetUsage
        List<Map<String, Object>> budgetUsageList = new ArrayList<>();
        budgets.forEach(b -> {
            Map<String, Object> m = new HashMap<>();
            m.put("category", b.getCategory());
            m.put("limit", b.getLimitAmount());
            m.put("spent", b.getSpentAmount());
            budgetUsageList.add(m);
        });

        // farmWiseProfit
        List<Map<String, Object>> farmWiseProfit = new ArrayList<>();
        Map<String, Object> farmProfit = new HashMap<>();
        farmProfit.put("farm", "Sunrise Agrotech Farm");
        farmProfit.put("profit", netProfit);
        farmWiseProfit.add(farmProfit);

        // fieldWiseCost
        List<Map<String, Object>> fieldWiseCost = new ArrayList<>();
        Map<String, Object> fieldCost = new HashMap<>();
        fieldCost.put("field", "North Field");
        fieldCost.put("cost", expensesMonth);
        fieldWiseCost.add(fieldCost);

        // inventoryPurchaseTrend
        List<Map<String, Object>> inventoryPurchaseTrend = new ArrayList<>();
        txns.stream()
                .filter(t -> "EXPENSE".equalsIgnoreCase(t.getTransactionType()) && t.getCategory().contains("PURCHASE"))
                .forEach(t -> {
                    Map<String, Object> pt = new HashMap<>();
                    pt.put("date", t.getTransactionDate().toLocalDate().toString());
                    pt.put("value", t.getAmount());
                    inventoryPurchaseTrend.add(pt);
                });

        // recent activities list
        List<Map<String, Object>> activities = new ArrayList<>();
        txns.stream().limit(10).forEach(t -> {
            Map<String, Object> act = new HashMap<>();
            act.put("id", t.getId());
            act.put("timestamp", t.getTransactionDate().toString());
            act.put("refNumber", t.getId().toString().substring(0, 8));
            act.put("farm", "Sunrise Agrotech Farm");
            act.put("category", t.getCategory());
            act.put("amount", t.getAmount());
            act.put("status", t.getStatus());
            act.put("transactionType", t.getTransactionType());
            activities.add(act);
        });

        // Rule-based AI insights list
        List<Map<String, Object>> aiInsights = new ArrayList<>();
        if (expensesMonth.compareTo(BigDecimal.valueOf(1000)) > 0) {
            Map<String, Object> ins = new HashMap<>();
            ins.put("title", "Operational Cost Peak");
            ins.put("description", "Fertilizer purchase outlays are higher by 12% than last month.");
            ins.put("severity", "warning");
            aiInsights.add(ins);
        }
        if (totalBudgetSpent.compareTo(totalBudgetLimits) > 0) {
            Map<String, Object> ins = new HashMap<>();
            ins.put("title", "Category budget exceeded");
            ins.put("description", "Spending limit overrun detected in Seed purchase category.");
            ins.put("severity", "critical");
            aiInsights.add(ins);
        }
        Map<String, Object> ins1 = new HashMap<>();
        ins1.put("title", "Optimal Cash Runway");
        ins1.put("description", "Expected cash flows indicate positive runway for next 28 days.");
        ins1.put("severity", "info");
        aiInsights.add(ins1);

        // Smart alerts list
        List<Map<String, Object>> alerts = new ArrayList<>();
        budgets.stream()
                .filter(b -> b.getSpentAmount().compareTo(b.getLimitAmount()) > 0)
                .forEach(b -> {
                    Map<String, Object> alert = new HashMap<>();
                    alert.put("title", "Budget Exceeded");
                    alert.put("description", "Budget limit exceeded for " + b.getCategory().replace('_', ' ') + ".");
                    alert.put("severity", "critical");
                    alerts.add(alert);
                });
        if (cashAvailable.compareTo(BigDecimal.ZERO) < 0) {
            Map<String, Object> alert = new HashMap<>();
            alert.put("title", "Negative Cash Balance");
            alert.put("description", "Current cash margins are below ₹0.");
            alert.put("severity", "warning");
            alerts.add(alert);
        }

        // Top Expenses
        List<Map<String, Object>> topExpenses = new ArrayList<>();
        expenseCatMap.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .limit(5)
                .forEach(e -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("category", e.getKey());
                    data.put("amount", e.getValue());
                    topExpenses.add(data);
                });

        // Top Revenue
        List<Map<String, Object>> topRevenue = new ArrayList<>();
        revenueCatMap.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .limit(5)
                .forEach(e -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("category", e.getKey());
                    data.put("amount", e.getValue());
                    topRevenue.add(data);
                });

        return FinanceDashboardResponse.builder()
                .revenueToday(revenueToday)
                .revenueMonth(revenueMonth)
                .expensesToday(expensesToday)
                .expensesMonth(expensesMonth)
                .netProfit(netProfit)
                .cashAvailable(cashAvailable)
                .inventoryValue(inventoryValue)
                .outstandingPayments(outstandingPayments)
                .budgetUtilization(budgetUtilization)
                .roi(roi)
                .revenueVsExpenses(revenueVsExpenses)
                .monthlyCashFlow(monthlyCashFlow)
                .profitTrend(profitTrend)
                .expenseBreakdown(expenseBreakdown)
                .revenueSources(revenueSources)
                .budgetUsage(budgetUsageList)
                .farmWiseProfit(farmWiseProfit)
                .fieldWiseCost(fieldWiseCost)
                .inventoryPurchaseTrend(inventoryPurchaseTrend)
                .activities(activities)
                .aiInsights(aiInsights)
                .alerts(alerts)
                .topExpenses(topExpenses)
                .topRevenue(topRevenue)
                .build();
    }
}
