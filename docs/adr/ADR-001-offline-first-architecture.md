# ADR-001: Offline-First Architecture

**Date:** 2026-07-15
**Status:** Accepted
**Context:** The Smart Farm Platform serves users in rural Tamil Nadu where internet connectivity is unreliable. The product principles mandate "Offline First" and "Data Never Lost."

## Decision

All data mutations follow a **local-first write pattern**:

1. Every mutation writes to IndexedDB (via Dexie.js) *before* any network call
2. The UI reads from the local store, behaving identically online or offline
3. Each local write creates a sync queue entry
4. A background process drains the queue against the API when online
5. Conflicts use last-write-wins with the losing write preserved in `sync_log`

Frontend hooks (`useOfflineMutation`, `useOfflineQuery`) abstract this pattern so feature developers never write raw TanStack Query mutations against the API directly.

## Consequences

- Every feature module must use the offline-aware hooks, not raw API calls
- The sync queue must handle ordered replay, retry with backoff, and failure recovery
- IndexedDB schema must mirror the server entities that need offline support
- Storage quota management is needed for low-end devices
- Conflict resolution is append-only where possible; update conflicts are rare and flagged for review
