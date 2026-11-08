# Database

One PostgreSQL 18 database is divided into `identity`, `groups`, `chat`, `events`, `games`, `werewolf`, `stranger_chat` and `learning` schemas. Each module owns one DbContext and a schema-local `__EFMigrationsHistory` table. No cross-schema foreign key, navigation or direct table query is allowed.

Games is implemented by `GamesDbContext`, `InitialGames` and `ExpandCaroBoard`. It owns `games.CaroGames`; group and player UUIDs have no cross-schema foreign keys. New games use a 15 × 15 board and five-in-a-row rule, while migrated 3 × 3 games retain their original three-in-a-row behavior. `BoardSize`, `WinLength`, board length and the `X|O|-` alphabet are protected by schema-local check constraints; different X/O players are enforced separately. Player/time indexes support the bounded personal game list. `Version` is an application-managed UUID concurrency token so simultaneous moves produce one winner and a 409 response for stale clients. The down migration refuses to continue while any 15 × 15 row exists, avoiding silent game deletion or board truncation.

Learning is implemented by `LearningDbContext` and `InitialLearning`. It owns curriculum, lesson activities, vocabulary relations and user progress. Foreign keys exist only inside `learning`; Identity user IDs are UUID values without a cross-schema FK. Composite progress keys make completion idempotent, while score/progress/status/HSK check constraints protect direct writes. Seeded HSK content uses deterministic IDs and a content version.

`AddReadingDocuments` adds `learning.reading_documents`. Every row carries an owner UUID value without a cross-schema FK, a 120-character title, normalized content bounded to 10,000 characters, derived counts and UTC timestamps. `(UserId, CreatedAtUtc)` supports the newest-first private library. The service takes a PostgreSQL transaction advisory lock per user before enforcing the 50-document quota, so concurrent saves cannot exceed it. PostgreSQL TOAST handles compression for longer text; list queries project metadata and load content only when a user opens one document.

Identity is implemented by `IdentityDbContext` and migration `InitialIdentity`. It owns `identity.Users`, `Roles`, `RoleClaims`, `UserClaims`, `UserLogins`, `UserRoles` and `UserTokens`. `NormalizedEmail` is required and uniquely indexed; display name is required and limited to 50 characters. Password hash, lockout, concurrency stamp and security stamp use ASP.NET Core Identity columns. The migrator applies Identity, Groups, Chat, Events and Werewolf migrations sequentially and fails nonzero when a connection or migration fails.

Groups is implemented by `GroupsDbContext` and migration `InitialGroups`. It owns `groups.Groups`, `GroupMembers`, `GroupInvitations` and `GroupAuditRecords`. There are no foreign keys to the Identity schema; user IDs cross the module boundary as UUID values and display names are read through an Identity contract.

- `GroupMembers` has a composite primary key `(GroupId, UserId)`, preventing duplicate membership, plus an index on `UserId` for “my groups”.
- A filtered unique index on `GroupId` where `Role = 'Owner'` prevents a second owner. Application transactions preserve exactly one owner during supported operations.
- `Groups.Version` is an application-managed UUID concurrency token. Ownership transfer first updates this token and demotes the current owner, then promotes the target and commits both phases in one transaction; stale updates return conflict.
- Invitations store a unique 32-byte SHA-256 `TokenHash`, never the raw 256-bit token. `(GroupId, ExpiresAtUtc)` supports owner invitation management and expiry filtering.
- Audit records are indexed by `(GroupId, OccurredAtUtc)` and persist actor, action, optional subject, UTC timestamp and trace ID in the same module transaction. They contain no invitation token.

Chat is implemented by `ChatDbContext`, `InitialChat`, `AddChatMessageKinds` and `CompleteChatInteractions`. It owns `chat.Messages` and `MessageReactions`; group, sender and reactor UUIDs deliberately have no cross-schema foreign keys. Content is required and bounded to 2,000 characters. `Kind` is a required 16-character enum string guarded by `CK_Messages_Kind` (`Text|Sticker`). `ReplyToMessageId` is a restrictive self-FK; Application checks that the target belongs to the same group. Reactions use `(MessageId, UserId)` as their primary key and a fixed check constraint. The unique `(GroupId, SenderUserId, ClientMessageId)` index enforces retry idempotency under races, while `(GroupId, SentAtUtc, Id)` supports stable cursor reads. All timestamps use `timestamptz`.

`AddMessageEditing` adds nullable `EditedAtUtc` and application-managed UUID `Version` to every Chat message. Existing rows receive random versions during migration; edits compare the submitted version through EF concurrency handling and rotate it on success.

`AddImageMessages` extends the Chat kind constraint with `Image`. PostgreSQL stores only a 64-character SHA-256 storage key; compressed WebP bytes live in the private media volume and are returned only through a membership-authorized API endpoint. The content-addressed key deduplicates identical images.

`AddChatReadStates` adds `chat.ReadStates` with composite key `(GroupId, UserId)`, `LastReadAtUtc timestamptz` and an index on `UserId`. It deliberately has no cross-schema foreign key. The cursor only advances; messages from the same user are excluded from unread counts. No backfill is required, so existing messages from other members remain unread until the conversation is opened.

Events is implemented by `EventsDbContext` and migration `InitialEvents`. It owns `events.Events`, `EventRsvps` and `EventAuditRecords`; group/user UUIDs have no cross-schema foreign keys.

- Event text is bounded to 120 characters for title, 2,000 for description and 200 for location. Absolute times use `timestamptz`.
- `(GroupId, StartsAtUtc, Id)` supports the bounded group event list. `Version` is an application-managed UUID concurrency token checked by EF for edit/confirm/cancel races.
- `EventRsvps` has primary key `(EventId, UserId)`. PostgreSQL `ON CONFLICT` performs atomic upsert, and the event row is locked before the `Open` check so confirm/cancel cannot race a late RSVP through the lock rule.
- Confirmation/cancellation audit records are written in the same Events `SaveChanges` as the status transition and indexed by `(EventId, OccurredAtUtc)`.

Rolling back an initial module migration drops its module data and is destructive once real data exists.

Stranger Chat is implemented by `StrangerChatDbContext`, its prior migrations and `CompleteChatInteractions`. It owns `stranger_chat.guest_sessions`, `matchmaking_tickets`, `conversations`, `messages`, `message_reactions`, `blocks` and `reports`. Session cookies are represented only by unique SHA-256 hashes. Message kind is constrained to `Text|Sticker`; reply uses a restrictive self-FK plus a same-conversation Application check. `(MessageId, SessionId)` permits one allow-listed reaction per guest. Queue membership is unique per session, message retries are unique on `(ConversationId, SenderSessionId, ClientMessageId)`, and `UX_reports_conversation_reporter` permits only one report per conversation/reporter under concurrent retries. It has no cross-schema foreign key.

Stranger Chat's `AddMessageEditing` migration independently adds `EditedAtUtc` and a UUID concurrency `Version` to its own messages; no authenticated Chat table or identity record is shared.

Werewolf is implemented by `WerewolfDbContext` and migration `InitialWerewolf`. It owns `werewolf.Rooms`, `RoomPlayers`, `Games`, `GamePlayers`, `GameActions`, `GameVotes` and `GameEvents`; Identity user IDs are UUID values without cross-schema foreign keys.

- Room codes are unique; membership uses `(RoomId, UserId)`. Public lobby discovery is indexed by visibility/status/create time.
- One game is owned by one room. `Games.Version` and `Rooms.Version` are application UUID concurrency tokens; `(Phase, PhaseEndsAtUtc)` supports the single-instance due-phase worker.
- Private roles live only in `GamePlayers`. Seat uniqueness is enforced per game and role rows are never used as public API DTOs.
- `(GameId, PhaseSequence, ActorUserId)` permits one effective skill action per phase. The separate client-action unique index makes retries idempotent.
- Votes use `(GameId, PhaseSequence, VoterUserId)` as primary key and a client-action unique index. Targets stay private until server resolution.
- Game events are bounded to 500 characters and can be public or scoped by `RecipientUserId`, used for Seer/Witch private results.
