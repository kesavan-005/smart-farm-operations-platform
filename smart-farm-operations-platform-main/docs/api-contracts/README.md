# API Contracts

This directory contains OpenAPI specifications for the Smart Farm REST API.
Specs are added per phase, before implementation begins.

## Convention

- One YAML file per feature module (e.g., `auth.yaml`, `farms.yaml`)
- Both frontend and backend build against these specs
- Specs are the contract — any deviation is a bug

## Files

| File | Phase | Module |
|------|-------|--------|
| `auth.yaml` | Phase 2 | Authentication & Authorization |
| `farms.yaml` | Phase 3 | Farm CRUD |
| `fields.yaml` | Phase 3 | Field CRUD |
| `crops.yaml` | Phase 3 | Crop CRUD |
| `activities.yaml` | Phase 3 | Activity CRUD |
| `media.yaml` | Phase 3 | Image upload (pre-signed URLs) |
| `inventory.yaml` | Phase 4 | Inventory management |
| `labour.yaml` | Phase 4 | Labour management |
| `finance.yaml` | Phase 4 | Expenses, Income, Harvest |
| `weather.yaml` | Phase 5 | Weather data |
| `notifications.yaml` | Phase 5 | Notification system |
| `reports.yaml` | Phase 5 | Reports & export |
| `settings.yaml` | Phase 5 | User preferences |
| `admin.yaml` | Phase 6 | Admin management |
