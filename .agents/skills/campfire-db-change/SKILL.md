---
name: campfire-db-change
description: Change an Campfire PostgreSQL model, query, index or migration while preserving module schema ownership and concurrency behavior.
---

Read `docs/database.md` and ADR 002. Confirm the owning module; do not add cross-schema access or foreign keys. Use UUIDs and UTC `timestamptz`, bounded projections, intentional uniqueness/indexes and supported concurrency tokens. Generate that module's migration and review SQL. Verify from a blank real PostgreSQL database plus relevant concurrency/idempotency tests; document rollback or expand-contract implications.
