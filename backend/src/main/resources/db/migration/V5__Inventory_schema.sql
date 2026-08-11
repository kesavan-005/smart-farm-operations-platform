CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ta VARCHAR(100),
    capacity NUMERIC(12, 2) NOT NULL,
    location VARCHAR(255),
    manager VARCHAR(100),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ta VARCHAR(100),
    icon VARCHAR(50),
    color VARCHAR(50),
    description TEXT,
    parent_category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    name_ta VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    barcode VARCHAR(100),
    category_id UUID REFERENCES inventory_categories(id) ON DELETE SET NULL,
    subcategory VARCHAR(100),
    description TEXT,
    current_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    unit VARCHAR(20) NOT NULL,
    minimum_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    maximum_stock NUMERIC(12, 2),
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    selling_price NUMERIC(12, 2),
    supplier VARCHAR(100),
    storage_location VARCHAR(100),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    expiry_date DATE,
    batch_number VARCHAR(50),
    image_url VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(30) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for lookup performance
CREATE INDEX idx_warehouses_farm ON warehouses(farm_id) WHERE deleted = FALSE;
CREATE INDEX idx_inv_categories_farm ON inventory_categories(farm_id) WHERE deleted = FALSE;
CREATE INDEX idx_inv_items_farm ON inventory_items(farm_id) WHERE deleted = FALSE;
CREATE INDEX idx_inv_items_warehouse ON inventory_items(warehouse_id) WHERE deleted = FALSE;
CREATE INDEX idx_inv_items_category ON inventory_items(category_id) WHERE deleted = FALSE;
CREATE INDEX idx_stock_trans_item ON stock_transactions(inventory_item_id);
