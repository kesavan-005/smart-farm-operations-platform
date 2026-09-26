# Smart Farm Operations & Automation Platform

A bilingual (Tamil/English), offline-first, role-based farm management Progressive Web Application (PWA) tailored for farm operations in Tamil Nadu.

---

## 🚀 Key Features

- 🌾 **Farm & Field Management**: Geofenced farm boundary drawing via interactive maps (Leaflet/OpenStreetMap), automated area and coordinate calculation, location details, and soil profile tracking.
- 🌱 **Crop Management**: Crop variety tracking, seasonal crop cycle planning, and growth stage management.
- 📋 **Task & Activity Management**: Task allocation, status tracking (Todo, In Progress, On Hold, Completed, Cancelled), priority levels, and worker assignment.
- 📦 **Inventory Management**: Real-time stock levels, category categorization, unit tracking, and low-stock alerts.
- 💰 **Financial Management**: Expense and income recording, budget tracking, transaction categorization, and journal ledger reports.
- 🌐 **Bilingual Support (i18n)**: Instant language switching between English and Tamil (தமிழ்).
- 📶 **Offline-First PWA**: Built-in IndexedDB caching (via Dexie.js), background sync queue, and PWA offline capabilities.
- 🔐 **Role-Based Security**: JWT-based authentication supporting Admin, Farm Owner, Farm Manager, and Worker roles.

---

## 🏗️ Project Architecture

Organized as a modular monorepo:

```
smart-farm-operations-platform/
├── frontend/          # React 19 + Vite + TypeScript + Tailwind CSS
├── backend/           # Spring Boot 3 + Java 17 + PostgreSQL + Hibernate
├── infrastructure/    # Infrastructure configuration & docs
└── docs/              # Architecture docs, contracts, and guidelines
```

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| **State & Data** | TanStack Query (Server State), Zustand (Client State), React Hook Form & Zod |
| **Offline Storage** | Dexie.js (IndexedDB), Workbox Service Worker |
| **Backend** | Spring Boot 3, Java 17, Spring Security, MapStruct, Lombok |
| **Database** | PostgreSQL 16 + PostGIS / H2 (Dev profile), Flyway migrations |
| **Cache & Media** | Redis 7, MinIO / S3 Storage |
| **Localization** | i18next (English & Tamil) |
| **Mapping** | Leaflet + OpenStreetMap + Turf.js |

---

## 📋 Prerequisites

- **Node.js** 18+ and **npm** 9+
- **JDK** 17+
- **Maven** 3.9+
- **Docker Desktop** (optional, for PostgreSQL, Redis, MinIO)

---

## 🚀 Getting Started

### 1. Start Infrastructure (Optional for local H2 dev mode)

```bash
docker-compose up -d
```

### 2. Start Backend API

```bash
cd backend
# Using included Maven wrapper or installed mvn
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

- **API Base URL**: `http://localhost:8080`
- **Swagger Documentation**: `http://localhost:8080/swagger-ui.html`
- **Health Check**: `http://localhost:8080/actuator/health`

### 3. Start Frontend Web Application

```bash
cd frontend
npm install
npm run dev
```

- **Web Application**: `http://localhost:5173`

---

## 🧪 Available Scripts & Commands

### Frontend

```bash
npm run dev          # Start Vite development server
npm run build        # Build production PWA assets
npm run preview      # Preview production build locally
npm run type-check   # Run TypeScript strict type verification
npm run lint         # Run ESLint check
```

### Backend

```bash
mvn clean compile                      # Clean and compile Java classes
mvn spring-boot:run                    # Run application with default profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev # Run with development profile
mvn test                               # Execute backend unit tests
```

---

## 📄 License

Private — All rights reserved.
