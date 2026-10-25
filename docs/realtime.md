# Realtime

Chat sends text/sticker mutations through REST and uses authenticated SignalR at `/hubs/chat` only for subscription and `MessageCreated` notifications. Notifications include the persisted `kind` and allow-listed content code, never a client-provided media URL. `Subscribe(groupId)` verifies current membership on the server before joining `chat:{groupId}`. PostgreSQL is authoritative and the message commit completes before best-effort broadcast.

Angular uses automatic reconnect, subscribes again after reconnect, queries REST with its latest time-plus-ID cursor, and deduplicates by message ID/client message ID. Delivery is intentionally at-least-once at the UI boundary; exactly-once delivery is not claimed. If realtime publication fails after commit, REST still reports the persisted message and reconciliation recovers it.

The initial deployment is single-instance. An in-memory connection registry records user/group subscriptions. Groups publishes a post-commit membership-revoked contract when a member leaves or is removed; Chat immediately removes every matching live connection from that SignalR group. A future multi-instance deployment must replace this process-local coordination with an appropriate distributed backplane/revocation mechanism before scaling out.

Werewolf uses authenticated SignalR at `/hubs/werewolf`. `Subscribe(roomId)` verifies room participation through a MediatR command before joining `werewolf:{roomId}`. Notifications contain only `roomId` and a version signal (`RoomChanged` or `VoicePermissionsChanged`); they never contain roles, actions, votes or private results. On reconnect, Angular subscribes again and fetches the authoritative caller-filtered snapshot over REST.

Voice is transported by LiveKit rather than SignalR. Lobby, living, werewolf and optional dead conversations use phase-specific LiveKit room names. Backend tokens are short-lived and grant only room join, microphone publication when allowed and subscription. Phase transitions close all prior phase rooms through the LiveKit server API before clients reconnect to an authorized channel. Audio is not recorded or persisted.

Stranger Chat uses `/hubs/stranger`. The hub reads the HttpOnly guest cookie, resolves the active conversation through the Application port and joins only `stranger:{conversationId}`. REST remains authoritative for matching and messages; notifications occur after commit. The client reconciles from persistence and deduplicates using `clientMessageId`; exactly-once delivery is not claimed.
