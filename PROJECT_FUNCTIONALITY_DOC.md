# Smart Farm Operations Platform (Project Uzhavan)
## Complete Technical & Functional Reference Manual

---

## Executive Overview

**Project Uzhavan (Smart Farm Operations Platform)** is an enterprise-grade, offline-first, bilingual (English ↔ Tamil) precision agriculture management web application built for small, medium, and multi-farm operations in India and worldwide.

The platform empowers farmers and farm managers with end-to-end digital farm oversight: from Interactive GPS Boundary Mapping, Soil & Field Management, Crop Lifecycle Tracking, and Live Weather Forecasting (Open-Meteo), to Inventory Control, Activity/Task Kanban Management, and Financial Accounting (Income & Expenses).

---

## 1. System Architecture & Tech Stack

### Backend Architecture
- **Framework**: Java 17, Spring Boot 3.3.0, Spring MVC, Spring Data JPA, Spring Security (JWT Stateless Auth).
- **Database**: PostgreSQL 16 with PostGIS spatial extensions (`geometry(Polygon, 4326)`) & Hibernate Spatial.
- **ORM & Migrations**: Hibernate 6.5, Flyway Database Migrations.
- **Caching**: Dual-Layer Caching — Redis 7 (primary) + In-Memory `ConcurrentHashMap` fallback cache.
- **Build Tooling**: Apache Maven 3.9.6, Lombok, MapStruct, Spotless Code Formatter.

### Frontend Architecture
- **Framework**: React 19, Vite 8.1 PWA, TypeScript 5.
- **Styling & UI**: Vanilla TailwindCSS, Lucide Icons, Modern Dark/Light Design System.
- **State & Data Fetching**: Zustand (Theme & Language persistence), TanStack React Query (Server State).
- **Offline Storage**: Dexie.js (IndexedDB) for client offline persistence + Workbox Service Worker for precaching static assets.
- **GIS & Mapping**: Leaflet.js, React-Leaflet, Turf.js (Polygon area & centroid calculations).
- **Localization**: `i18next` providing instant, zero-API offline switching between **English (en)** and **Tamil (ta)**.

---

## 2. Comprehensive Core Features & Functionality

### Module 1: Authentication & User Security (`/features/auth`)
- **User Registration & Login**: JWT-based secure authentication with BCrypt password hashing.
- **Role-Based Access Control (RBAC)**: Support for Farm Owner, Farm Manager, Worker, and Auditor roles.
- **User Profile Management**: Manage contact info, preferred language, and notification preferences.
- **Session Security**: Stateless JWT validation filter (`JwtAuthenticationFilter`) with token expiration.

---

### Module 2: Multi-Farm & GPS Boundary Management (`/features/farms`)
- **Multi-Farm Support**: Seamless management of multiple isolated farms per user account.
- **Interactive Boundary Mapping**:
  - GPS-based boundary drawing using Leaflet.js.
  - Automatic GeoJSON polygon creation & PostGIS spatial persistence.
  - Real-time farm boundary area calculation (Acres / Hectares / Cents / Sq. Meters) powered by Turf.js.
  - Automatic centroid calculation for precise farm coordinates (`latitude`, `longitude`).
- **Comprehensive Farm Profiling**:
  - Farm Name & Tamil Name (`nameTa`).
  - Total Area & Area Unit.
  - Administrative Address: Village, Taluk, District, State, Pincode.
  - Soil Characteristics: Soil Type (Red, Black, Alluvial, Clay, Sandy, Loam), Soil pH, Soil Organic Carbon.
  - Water & Irrigation Profile: Irrigation Type (Drip, Sprinkler, Flood, Rainfed), Water Source (Borewell, Well, Canal, River, Tank), Water Availability, Drainage Type, Average Rainfall.

---

### Module 3: Field & Plot Management (`/features/fields`)
- **Sub-Farm Partitioning**: Division of farms into dedicated fields/plots.
- **Field Spatial Mapping**: Leaflet map boundary visualization per field plot.
- **Soil & Agronomic Metrics**: Field-specific soil pH, organic carbon content, drainage capability, and water source tracking.
- **Field Status**: Active, Fallow, Under Preparation, Inactive states.

---

### Module 4: Crop Lifecycle & Planting Tracking (`/features/crops`)
- **Crop Catalog & Plantation Tracking**:
  - Support for Paddy (Nel), Sugarcane, Coconut, Banana, Cotton, Maize, Pulses, Vegetables, etc.
  - Variety & Season tracking (Kharif, Rabi, Zaid, Navarai, Sornavari, Samba).
- **Growth Stage Monitoring**: Sowing Date, Expected Harvest Date, Planting Method (Transplanting, Direct Seeding), Growth Stage (Germination, Vegetative, Flowering, Yielding, Harvested).
- **Yield Forecasting & Harvest Records**: Expected Yield vs Actual Yield tracking, yield metrics (Tons, Kgs, Bags).
- **Bilingual Notes**: Field-level notes in English and Tamil (`notesTa`).

---

### Module 5: Live Weather Service & Open-Meteo API (`/features/weather`)
- **Coordinate-Based Weather**: Requests live weather directly using the farm's exact PostGIS centroid (`latitude`, `longitude`).
- **Explicit Current Weather Parameters**:
  - Real-time Temperature (°C) & Apparent (Feels Like) Temperature.
  - Real-time Humidity (%) & Rain Amount (mm).
  - Real-time Precipitation Probability Now (%).
  - Real-time 10m Wind Speed (km/h) & Wind Direction.
  - Weather Code with translated condition text (Clear Sky, Partly Cloudy, Rainy, Thunderstorm, Fog, Drizzle) & dynamic icons.
- **Hourly Forecast**: 24-hour breakdown of temperature, rain probability, and weather condition.
- **7-Day Daily Forecast**: Daily High/Low temperature, maximum precipitation probability, total rain sum, sunrise & sunset times, and max wind speed.
- **Smart Farm Weather Alerts**:
  - **`rainExpected` Alert**: Triggers when today's maximum rain probability exceeds 60%.
  - **`strongWind` Alert**: Triggers when today's maximum wind speed exceeds 30 km/h.
- **Resilient Caching & Offline Fallback**:
  - Farm-specific Redis cache key `weather:farm:{farmId}` (configurable TTL, default 45 mins).
  - Local in-memory `ConcurrentHashMap` cache fallback if Redis is disabled.
  - Dexie IndexedDB client offline cache displaying `Showing last available weather` when offline.
- **Coordinate Validation**: Safe range validation (`latitude [-90, 90]`, `longitude [-180, 180]`), throwing `LocationUnavailableException` for invalid or missing coordinates.

---

### Module 6: Inventory & Warehouse Management (`/features/inventory`)
- **Item Master Catalog**: Fertilizers, Pesticides, Seeds, Equipment, Fuel, Harvested Produce, Packaging materials.
- **Stock Control & Reorder Alerts**: Current Quantity, Minimum Stock Level (Low Stock Alerting), Maximum Stock Limit, Reorder Thresholds.
- **Multi-Warehouse Storage**: Warehouses, Storage Units, Storage Location Details.
- **Batch & Expiry Management**: Batch Numbers, Expiry Date alerts, Barcodes, SKU tracking, Selling Price & Purchase Cost.
- **Inventory Transactions**: Audit log of stock movements:
  - `PURCHASE` (Stock In)
  - `SALE` (Stock Out / Harvest Revenue)
  - `USAGE` (Field Application)
  - `TRANSFER` (Warehouse to Warehouse)
  - `ADJUSTMENT` (Stock Count Fix)
  - `RETURN` (Supplier Return)
  - `WASTE` (Spoilage / Damage)
  - `HARVEST_STORAGE` (Farm Harvest Inflow)

---

### Module 7: Task & Activity Management (`/features/tasks` / `/features/activity`)
- **Kanban Task Board**: Interactive Drag-and-Drop Kanban interface (Pending, In Progress, Completed, Cancelled).
- **Task Scheduling & Operations**:
  - Scheduled Start & End Dates.
  - Estimated Duration vs Actual Duration.
  - Priority Management (Low, Medium, High, Urgent).
  - Assigned Supervisor & Worker attribution.
- **Resource Allocation**: Links tasks to specific Farms, Fields, Crops, Required Equipment, and Inventory items.
- **Cost Estimation**: Estimated Cost vs Actual Financial Expense tracking.

---

### Module 8: Finance & Cost Accounting (`/features/finance`)
- **Income & Expense Tracking**: Record farm financial transactions (Crop Sales, Equipment Purchase, Labor Payments, Fertilizer Usage, Maintenance).
- **Financial Categorization**: Detailed expense/income categories, Payment Methods (Cash, Bank Transfer, UPI, Cheque), Reference Numbers/Receipts.
- **Financial Dashboard & Metrics**: Total Revenue, Total Expenses, Net Profit Margin per farm and per crop cycle.

---

### Module 9: Offline-First PWA Architecture (`/offline`)
- **Dexie.js (IndexedDB)**: Client-side storage caching Farms, Fields, Crops, Weather, Tasks, and Inventory items locally.
- **Workbox Service Worker**: Complete precaching of app bundle, styles, fonts, and assets for offline use.
- **Background Sync Capability**: Queue changes made while offline and synchronize automatically when network connectivity is restored.
- **Offline UI Indicator**: Real-time connection status banner (`WifiOff` badge, offline last-cached timestamps).

---

### Module 10: Bilingual (English ↔ Tamil) UI Localization (`/i18n`)
- **100% UI Coverage**: Instant language switching between English and Tamil across all screens, forms, tables, overlays, and dialogs.
- **Tamil Language Features**: Support for Tamil script farm names (`nameTa`), crop notes (`notesTa`), weather labels, inventory names (`nameTa`), and administrative regions (Gramam, Taluk, Maavattam).
- **Offline Persistence**: Active language stored in `localStorage` under `smartfarm-language` with instant Zustand state rehydration.

---

## 3. Database Schema Overview (Entity Relationship Summary)

```
        ┌──────────────┐
        │    User      │
        └──────┬───────┘
               │ 1:N
        ┌──────▼───────┐
        │    Farm      │◄─────────────┐
        └──────┬───────┘              │
               │ 1:N                  │
  ┌────────────┼─────────────┐        │
  │ 1:N        │ 1:N         │ 1:N    │ 1:N
┌─▼──────┐ ┌───▼────┐ ┌──────▼───┐ │ ┌▼─────────┐
│ Field  │ │Inventory│ │  Finance │ │ │ Weather │
└─┬──────┘ └────────┘ └──────────┘ │ │ (Cached)│
  │ 1:N                            │ └─────────┘
┌─▼──────┐                         │
│ Crop   │                         │
└─┬──────┘                         │
  │ 1:N                            │
┌─▼────────────────────────────────▼┐
│            Task / Activity        │
└───────────────────────────────────┘
```

---

## 4. Key Security & Operational Highlights

1. **Strict Data Ownership**: Every REST endpoint enforces farm ownership verification (`farm.getOwner().getId().equals(userId)`).
2. **PostGIS Polygon Validation**: Ensures farm boundaries form valid spatial geometries without self-intersections.
3. **Resilient Weather Integration**: Coordinates strictly validated before external Open-Meteo HTTP calls; fallback stale cache ensures farm managers always see weather data offline.
4. **Clean Code & Build Standards**: Maven compilation, Spotless formatting, TypeScript type safety, PWA manifest compliance.

---

*Document compiled for Smart Farm Operations Platform (Project Uzhavan).*
