package com.smartfarm.features.finance.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FinanceDashboardResponse {
    // KPI metrics
    private BigDecimal revenueToday;
    private BigDecimal revenueMonth;
    private BigDecimal expensesToday;
    private BigDecimal expensesMonth;
    private BigDecimal netProfit;
    private BigDecimal cashAvailable;
    private BigDecimal inventoryValue;
    private BigDecimal outstandingPayments;
    private BigDecimal budgetUtilization;
    private BigDecimal roi;

    // Charts & break-ups
    private List<Map<String, Object>> revenueVsExpenses;
    private List<Map<String, Object>> monthlyCashFlow;
    private List<Map<String, Object>> profitTrend;
    private List<Map<String, Object>> expenseBreakdown;
    private List<Map<String, Object>> revenueSources;
    private List<Map<String, Object>> budgetUsage;
    private List<Map<String, Object>> farmWiseProfit;
    private List<Map<String, Object>> fieldWiseCost;
    private List<Map<String, Object>> inventoryPurchaseTrend;

    // Activity timeline, alerts and AI insights
    private List<Map<String, Object>> activities;
    private List<Map<String, Object>> alerts;
    private List<Map<String, Object>> aiInsights;

    // Top Expenses and Revenue categories
    private List<Map<String, Object>> topExpenses;
    private List<Map<String, Object>> topRevenue;
}
