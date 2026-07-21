package com.smartfarm.features.finance.mapper;

import com.smartfarm.features.finance.domain.FinancialBudget;
import com.smartfarm.features.finance.domain.FinancialTransaction;
import com.smartfarm.features.finance.domain.JournalEntry;
import com.smartfarm.features.finance.dto.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FinanceMapper {
    @Mapping(source = "farm.id", target = "farmId")
    FinancialTransactionResponse toResponse(FinancialTransaction transaction);

    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    FinancialTransaction toEntity(FinancialTransactionRequest request);

    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(FinancialTransactionRequest request, @MappingTarget FinancialTransaction transaction);

    @Mapping(source = "farm.id", target = "farmId")
    FinancialBudgetResponse toResponse(FinancialBudget budget);

    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    FinancialBudget toEntity(FinancialBudgetRequest request);

    @Mapping(target = "farm", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(FinancialBudgetRequest request, @MappingTarget FinancialBudget budget);

    @Mapping(source = "financialTransaction.id", target = "financialTransactionId")
    JournalEntryResponse toResponse(JournalEntry entry);
}
