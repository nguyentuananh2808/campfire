# ADR 009: Isolated guest boundary for Stranger Chat

Status: Accepted — 2026-10-16

Stranger Chat is a separate module and PostgreSQL schema. It does not reuse authenticated group-chat rows or query Identity/Groups data. A guest receives a 256-bit opaque HttpOnly cookie; only its SHA-256 hash is persisted. HTTP mutations use antiforgery, REST owns persistence, and SignalR emits post-commit notifications only.

The first release is pseudonymous, 18+, text-only and random 1:1. It supports leave, block and report, rejects URLs, and exposes no account lookup, media, location or demographic filters. Public rollout requires operational moderation and verified retention cleanup.
