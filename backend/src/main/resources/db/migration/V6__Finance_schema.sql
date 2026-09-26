CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- REVENUE, EXPENSE, LIABILITY, ASSET
    category VARCHAR(50) NOT NULL, -- SEED_PURCHASE, FERTILIZER_PURCHASE, HARVEST_SALE, PAYROLL, FUEL, EQUIPMENT, LOAN, OTHER
    amount NUMERIC(15, 2) NOT NULL,
    description TEXT,
    reference_id UUID, -- References Inventory item, crop, or labor ID
    reference_type VARCHAR(50), -- STOCK_TRANSACTION, HARVEST, LABOUR
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CASH', -- CASH, BANK_TRANSFER, CREDIT
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, PENDING, FAILED
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_transaction_id UUID REFERENCES financial_transactions(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL, -- CASH, INVENTORY, REVENUE, FARM_EXPENSE, LIABILITY
    entry_type VARCHAR(10) NOT NULL, -- DEBIT, CREDIT
    amount NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    limit_amount NUMERIC(15, 2) NOT NULL,
    spent_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE financial_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_transaction_id UUID,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operation VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indices
CREATE INDEX idx_financial_transactions_farm ON financial_transactions(farm_id) WHERE deleted = FALSE;
CREATE INDEX idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX idx_journal_entries_txn ON journal_entries(financial_transaction_id);
CREATE INDEX idx_financial_budgets_farm ON financial_budgets(farm_id);
