# API contract

All product routes use `/api/v1`. Identity exposes:

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/auth/antiforgery` | Anonymous | Issues the Angular-readable XSRF request-token cookie. |
| `POST` | `/api/v1/auth/register` | Anonymous + XSRF | Registers email/password/display name and signs in. No role field is accepted or assigned. |
| `POST` | `/api/v1/auth/login` | Anonymous + XSRF | Signs in with a non-persistent Identity cookie; failed attempts participate in lockout. |
| `GET` | `/api/v1/auth/me` | Cookie | Returns `{ id, email, displayName }` for the current account. |
| `POST` | `/api/v1/auth/change-password` | Cookie + XSRF | Requires current/new password, rotates the security stamp and preserves only the current session. |
| `POST` | `/api/v1/auth/logout` | Cookie + XSRF | Removes the current authentication cookie. |

The mutation body fields are exactly `email`, `password`, `displayName`, `currentPassword` and `newPassword` as applicable.

Groups exposes authenticated routes below. Every mutation, including invitation preview, requires the XSRF cookie/header pair. Group-scoped resources return 404 when the caller is not a member so private group existence is not disclosed; a known member without owner permission receives 403.

| Method | Route | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/groups` | Authenticated | Lists groups belonging to the current account. |
| `POST` | `/api/v1/groups` | Authenticated | Creates a private group and its single owner atomically. Body: `{ name }`. |
| `PATCH` | `/api/v1/groups/{groupId}` | Owner | Renames a group. Body: `{ name }`. |
| `GET` | `/api/v1/groups/{groupId}/members` | Member | Lists members with display name, role and join time. |
| `DELETE` | `/api/v1/groups/{groupId}/members/{userId}` | Owner | Removes a member. The owner cannot remove themselves. |
| `DELETE` | `/api/v1/groups/{groupId}/members/me` | Member | Leaves a group. The owner receives 409 until ownership is transferred. |
| `POST` | `/api/v1/groups/{groupId}/owner` | Owner | Transfers ownership transactionally. Body: `{ newOwnerUserId, expectedVersion }`; stale versions return 409. |
| `GET` | `/api/v1/groups/{groupId}/invitations` | Owner | Lists invitation metadata without tokens. |
| `POST` | `/api/v1/groups/{groupId}/invitations` | Owner | Creates an invitation valid for 1–168 hours. Body: `{ expiresInHours }`; the raw token is returned once. |
| `DELETE` | `/api/v1/groups/{groupId}/invitations/{invitationId}` | Owner | Revokes an invitation idempotently. |
| `POST` | `/api/v1/group-invitations/preview` | Authenticated | Validates `{ token }` and returns confirmation data without joining. |
| `POST` | `/api/v1/group-invitations/join` | Authenticated | Joins with `{ token }`; repeated joins return the existing membership without duplication. |

Invitation links use `/invites/accept#token=...`; URL fragments are not sent to the web server. Opening the page only previews the invitation. Membership is created only by the explicit join POST.

Chat exposes member-only routes. Non-members receive hidden 404 responses. Send requires XSRF and the `chat` rate-limit policy.

| Method | Route | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/groups/{groupId}/messages?before=&after=&limit=` | Member | Reads the implicit group conversation. `before` and `after` are mutually exclusive opaque cursors; limit defaults to 50 and is capped at 100. Results are chronological. |
| `POST` | `/api/v1/groups/{groupId}/messages` | Member + XSRF | Persists `{ clientMessageId, kind, content, replyToMessageId? }`. `kind` defaults to `Text` and accepts `Text|Sticker`. Reply targets must belong to this group. First creation returns 201, an identical retry returns 200, and reuse of the key with a different kind/content/reply returns 409. |
| `PUT` | `/api/v1/groups/{groupId}/messages/{messageId}/reaction` | Member + XSRF | Sets the caller's single basic reaction with `{ reaction }`; `null` removes it. Repeating the same value is idempotent. |

Text content must contain a non-whitespace character and be at most 2,000 characters; emoji remain ordinary Unicode text. Sticker content is one server allow-listed code: `campfire`, `laugh`, `cheer`, `heart`, `thumbs-up` or `sad`. Reactions are `Like|Love|Laugh|Wow|Sad`. Arbitrary sticker URLs, HTML and unknown codes are rejected. History DTOs include a bounded reply preview, reaction counts and the caller's reaction. SignalR emits `MessageCreated` after persistence and `MessageChanged` after a reaction commit; clients reconcile through REST.

Events exposes current-member-only routes. Non-members receive hidden 404 responses. Every mutation requires XSRF.

| Method | Route | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/groups/{groupId}/events?limit=` | Member | Lists at most 100 group events (default 50), newest start time first, including RSVP counts and the caller's explicit response. |
| `POST` | `/api/v1/groups/{groupId}/events` | Member + XSRF | Creates an `Open` event. Body: `{ title, description, startsAtUtc, location }`; start must be future. |
| `GET` | `/api/v1/groups/{groupId}/events/{eventId}` | Member | Returns detail, historical RSVP rows with `isCurrentMember`, and current members who are still `Unanswered`. |
| `PATCH` | `/api/v1/groups/{groupId}/events/{eventId}` | Creator or owner + XSRF | Updates event details with `{ ..., expectedVersion }`; stale version returns 409. Cancelled events are locked. |
| `POST` | `/api/v1/groups/{groupId}/events/{eventId}/status` | Creator or owner + XSRF | Body: `{ status, expectedVersion }`. Allows `Open -> Confirmed/Cancelled` and `Confirmed -> Cancelled`; stale or invalid transitions return 409. |
| `PUT` | `/api/v1/groups/{groupId}/events/{eventId}/rsvp` | Member + XSRF | Atomically upserts `{ response: Going|NotGoing }`. Only `Open` accepts changes; otherwise returns 409. |

Unanswered is represented explicitly in event detail and is never inferred as `NotGoing`.

Werewolf exposes authenticated routes below. Every mutation requires XSRF and the `werewolf` rate-limit policy. Room/game resources return hidden 404 when the caller is not a participant. Snapshot responses contain only the caller's `myRole`; player rows never contain role data.

| Method | Route | Permission | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/werewolf/rooms` | Authenticated | Lists at most 100 public lobbies. Private rooms are never listed. |
| `POST` | `/api/v1/werewolf/rooms` | Authenticated + XSRF | Creates a public/private 6–20 player lobby and returns its 8-character code. |
| `POST` | `/api/v1/werewolf/rooms/join` | Authenticated + XSRF | Idempotently joins by `{ code, spectator }`; players cannot join after start, spectators can. |
| `GET` | `/api/v1/werewolf/rooms/{roomId}` | Participant | Returns the caller-filtered lobby/game snapshot, public log and recipient-scoped private results. |
| `PATCH` | `/api/v1/werewolf/rooms/{roomId}` | Host + XSRF | Updates lobby settings with `expectedVersion`; stale or started rooms return 409. |
| `PUT` | `/api/v1/werewolf/rooms/{roomId}/ready` | Player + XSRF | Sets explicit lobby readiness. |
| `POST` | `/api/v1/werewolf/rooms/{roomId}/start` | Host + XSRF | Starts when 6–20 players are all ready and atomically assigns roles with cryptographic shuffling. |
| `DELETE` | `/api/v1/werewolf/rooms/{roomId}/players/me` | Participant + XSRF | Leaves a lobby; host transfers to the earliest remaining player. During a match the game seat is retained for reconnect, the caller is marked disconnected, and an explicitly leaving host transfers to another player. |
| `POST` | `/api/v1/werewolf/rooms/{roomId}/players/{userId}/moderation` | Host + XSRF | `mute`, `unmute`, or lobby-only `kick`; voice room is closed so old grants cannot keep publishing. |
| `POST` | `/api/v1/werewolf/rooms/{roomId}/voice-token` | Participant + XSRF | Returns a short-lived LiveKit token for the server-derived phase/channel, or 503 when unavailable/unauthorized. |
| `POST` | `/api/v1/werewolf/games/{gameId}/actions` | Alive eligible role + XSRF | Submits `{ clientActionId, kind, targetUserId }`; one effective action per actor/phase and late actions are rejected. An identical retry is idempotent; reusing the ID for another payload/phase returns 409. |
| `POST` | `/api/v1/werewolf/games/{gameId}/votes` | Alive player + XSRF | Submits a secret target or `null` blank vote. Progress counts are public but choices remain private until resolution. Identical retries are idempotent and changed/reused IDs conflict. |

The fixed first ruleset uses Villager, Werewolf, Seer, Guard and Witch. Each definition carries an ID, faction, icon, description, ability, wake phase/order and win condition; only caller-private role metadata is projected. Night phase timeouts are 45 seconds, discussion is 180 seconds and voting is 90 seconds. Missing actions become passes. Werewolf target ties resolve deterministically; day vote ties eliminate nobody. Guard cannot protect the same target on consecutive nights. Witch has one heal and one poison for the match and takes at most one action per night. Village wins when no Wolves remain; Wolves win at parity.

Errors use ProblemDetails with `code` and `traceId`. Intended status mapping is 400 validation, 401 unauthenticated, 403 known-but-forbidden, 404 absent/hidden resource, 409 conflict, 429 throttled and 500 unexpected failure.

Stranger Chat uses an opaque HttpOnly `Campfire.Guest` cookie and XSRF for every mutation. `POST /api/v1/stranger/session` accepts `{ nickname, gender, genderPreference, confirmsAdult }`, where `gender` is `Male|Female|Other` and `genderPreference` is `Any|Male|Female|Other`; unknown values return validation ProblemDetails. Session responses contain nickname, selection and expiry only—never the internal session ID or raw credential. `GET/DELETE /api/v1/stranger/session` reads or revokes the guest session. `POST/DELETE /matchmaking` joins/leaves the queue and only matches guests when both preferences accept the other guest's gender. `GET /conversation` returns the active match without disclosing the partner's gender. Message POST accepts `{ clientMessageId, kind, content, replyToMessageId? }`, with the same local sticker and reaction allowlists; reply targets must belong to the conversation. `PUT /conversations/{id}/messages/{messageId}/reaction` sets/removes one reaction for an active participant. `/end` optionally blocks the partner. `/reports` stores bounded moderation evidence idempotently and ends an active conversation immediately. Every resource access verifies the guest session and conversation participant server-side.
