# ADR 008: Werewolf authoritative state and phase-scoped voice

Context: Werewolf combines private roles, timed concurrent actions, reconnectable multiplayer state and voice whose listen/publish permissions change during a match. UI-only microphone locks or a shared voice room would expose secret channels.

Decision: PostgreSQL and the Werewolf server engine are authoritative. REST/MediatR owns commands; authenticated SignalR publishes post-commit state-version notifications and clients reconcile through caller-filtered REST snapshots. LiveKit is the self-hosted SFU. Each game phase uses opaque, phase-specific LiveKit room names for public, werewolf and optional dead channels. The backend alone issues short-lived tokens with derived publish/subscribe grants and closes prior phase rooms through the LiveKit server API when permissions change.

Consequences: roles and action results require separate private projections; every command needs phase/version/idempotency checks; a due-phase worker must define timeout fallbacks. Voice requires LiveKit/TURN configuration and cannot be fully accepted without real multi-device media testing. No audio recording or retention is enabled. Multiple API replicas later require a distributed scheduler/SignalR backplane before horizontal scaling.

Alternatives rejected: peer-to-peer mesh scales poorly at 20 players; browser-only mute does not revoke publish/listen capability; putting game mutations in SignalR obscures HTTP idempotency and conflict semantics.
