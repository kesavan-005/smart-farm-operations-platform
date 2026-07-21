# Smart Farm Operations & Automation Platform

A bilingual (Tamil/English), offline-first, role-based farm management Progressive Web Application (PWA) for Tamil Nadu.

## Architecture

**Modular monolith** — React 19 PWA frontend + Spring Boot 3 REST API backend, organized as a monorepo.

```
smart-farm-platform/
├── frontend/          # React 19 + Vite + TypeScript + Tailwind CSS
├── backend/           # Spring Boot 3 + Java 17 + PostgreSQL + Flyway
├── infrastructure/    # Future IaC (Terraform/CDK)
└── docs/              # Architecture docs, API contracts, ADRs
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| State | TanStack Query (server), Zustand (client), React Hook Form (forms) |
| Offline | Dexie.js (IndexedDB), Service Worker (Workbox), Background Sync |
| Backend | Spring Boot 3, Java 17, Spring Security, MapStruct |
| Database | PostgreSQL 16 + PostGIS, Flyway migrations |
| Cache | Redis 7 |
| Storage | AWS S3 (media), MinIO (local dev) |
| Auth | JWT (access + refresh tokens), Phone OTP |
| i18n | i18next (English + Tamil) |
| Maps | Leaflet + OpenStreetMap |

## Prerequisites

- **Node.js** 18+ and **npm** 9+
- **JDK** 17+
- **Maven** 3.9+
- **Docker Desktop** (for PostgreSQL, Redis, MinIO)

## Local Development Setup

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- PostgreSQL 16 with PostGIS on port `5432`
- Redis 7 on port `6379`
- MinIO (S3-compatible) on port `9000` (console: `9001`)

### 2. Start Backend

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

- Flyway runs migrations automatically
- Seed data loads in `dev` profile
- API available at `http://localhost:8080`
- Swagger UI at `http://localhost:8080/swagger-ui.html`
- Health check at `http://localhost:8080/actuator/health`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

- App available at `http://localhost:5173`
- API calls proxied to `http://localhost:8080`

## Key Commands

### Frontend

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run type-check   # TypeScript strict check
npm run test         # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
```

### Backend

```bash
mvn spring-boot:run                    # Start with default profile
mvn spring-boot:run -Dspring-boot.run.profiles=dev   # Start with dev profile
mvn test                               # Run all tests
mvn verify                             # Full verification
mvn spotless:apply                     # Format code
```

## Project Conventions

- See [CONTRIBUTING.md](./CONTRIBUTING.md) for coding standards
- See [docs/adr/](./docs/adr/) for architecture decisions
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)

## License

Private — All rights reserved.
