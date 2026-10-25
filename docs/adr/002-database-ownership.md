# ADR 002: Database ownership

Context: modules share one PostgreSQL instance. Decision: one schema, DbContext and migration history per module, without cross-schema foreign keys. Consequences: contracts validate external IDs and transactions stay module-local. Alternative rejected: shared DbContext erodes ownership.
