# ADR 004: REST mutation and SignalR notification

Context: chat needs clear idempotency and realtime UX. Decision: persist via REST, then broadcast a best-effort SignalR notification; reconnect replays from PostgreSQL. Consequences: no exactly-once broadcast claim. Alternative rejected: hub-only mutations obscure HTTP error/idempotency semantics.
