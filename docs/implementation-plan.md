# Implementation plan

Updated: 2026-10-25 (Asia/Saigon)

## M15.1 — Chuẩn hóa cấu trúc Clean Architecture của Learning

- [x] Tổ chức Domain theo `Courses`, `Progress`, `Vocabulary` và giữ Domain độc lập framework.
- [x] Tổ chức Application theo từng use case, đưa port vào `Abstractions`, validation/result vào `Common`, DTO vào `Models`.
- [x] Tổ chức Infrastructure theo `Persistence`, `Configurations`, `Seed`, `Services`, `Scoring`; mỗi EF entity có configuration riêng.
- [x] Tổ chức Presentation theo `Endpoints`, `Models`, `Errors` và giữ endpoint chỉ gọi `ISender`.
- [x] Giữ nguyên schema `learning`, table/index/constraint và migration ID; xác nhận EF không có pending model changes.
- [x] Build API, chạy unit test và architecture test sau tái cấu trúc.

## M15 — Học quanh lửa: Chinese Learning base

Phạm vi triển khai đã điều chỉnh theo kiến trúc và provider hiện có:

1. Tạo module `Learning` sở hữu schema PostgreSQL `learning`, đủ Domain/Application/Infrastructure/Presentation/Contracts và đi đúng `endpoint -> ISender -> handler -> ILearningService -> EfLearningService`.
2. Mô hình generic `Course -> Unit -> LearningDay -> LessonActivity`; HSK1 là curriculum data có version, không có controller/component riêng theo từng ngày.
3. Seed idempotent nội dung HSK1 cơ sở, vocabulary/sentence/grammar/exercise và relation graph. API thật cho dashboard hôm nay, lộ trình, chi tiết ngày, hoàn thành activity, nộp bài và vocabulary mind map.
4. Progress theo user Identity hiện tại, unique constraints chống trùng, transaction khi cộng XP/unlock và không có foreign key xuyên schema.
5. Angular thêm tab `Học quanh lửa`, hai chế độ `Lộ trình HSK1` và `Bản đồ từ vựng`, lazy route, typed API, loading/empty/error/pending và mobile-first.
6. AI/TTS/Speech không có provider nên không dựng fake success hoặc nút hoạt động giả. Mind map base dùng graph curriculum đã kiểm duyệt/cache trong PostgreSQL; capability response giải thích rõ giới hạn để nối provider thật ở phase sau.
7. Tạo tài liệu trực quan ánh xạ bài toán -> giải pháp -> file và luồng dữ liệu của module.

Acceptance criteria:

- User đã đăng nhập mở tab Học quanh lửa, xem lộ trình HSK1 và Day 1 từ API/database.
- User hoàn thành activity bắt buộc, nhận XP đúng một lần và mở ngày tiếp theo trong transaction.
- Exercise được chấm server-side; frontend không nhận đáp án đúng trước khi submit.
- Nhập vocabulary có trong curriculum trả mind map pinyin/nghĩa/example/relation; input ngoài dữ liệu trả trạng thái không hỗ trợ thay vì giả AI.
- Mutation có antiforgery, mọi endpoint yêu cầu Identity cookie, validation chạy qua MediatR và schema/migration thuộc riêng module.
- Backend/frontend build, test liên quan và migration PostgreSQL thật được ghi bằng chứng; phần không chạy được phải đánh dấu rõ.

## M14 Unified chat interactions and production theme repair

- [ ] Build one shared compact message-action control for Group Chat and Stranger Chat.
- [ ] Open reactions from a small trigger or a deliberate long press; keep reply icon-only with an accessible name.
- [ ] Keep reaction summaries compact and close the action tray after an action.
- [ ] Give both conversations a bounded scrolling viewport and reliably reveal newly rendered optimistic, REST and realtime messages.
- [ ] Apply dark mode through both the root attribute and a root class, then verify production tokens, responsive layouts, lint, tests and build.

### Acceptance criteria

- Message actions are not permanently expanded. Every sent message shows one compact action trigger; touch long-press and keyboard/click access open the same shared tray.
- The tray contains five allow-listed reactions and an icon-only reply action with Vietnamese accessible labels. Existing server authorization and persistence remain unchanged.
- Both chat variants use the shared core component/directive and preserve pending, failed, reply, reaction and sticker states.
- Initial history and every genuinely new message scroll the conversation viewport to the latest item without moving the whole page; loading older history does not force the user to the bottom.
- Selecting dark mode changes computed semantic colors even if browser storage is blocked; reload persistence remains best-effort.

## AWS single-EC2 container packaging

- [x] Add a production Angular/Nginx image with same-origin API and SignalR proxying.
- [x] Add an EC2 Compose manifest with Caddy TLS, private API/PostgreSQL networking, migrations, persistent keys and LiveKit ports.
- [ ] Validate automatic TLS on the real domain and run physical-device HTTP, SignalR and LiveKit acceptance against the EC2 instance.

- [x] M0: inspect environment; verify toolchain sources; create instructions, ADRs, repository skills and documentation skeleton.
- [x] M1: scaffold .NET modular monolith, Angular SPA, PostgreSQL Compose, migrations and architecture checks. Local PostgreSQL/LiveKit, migrations and API health checks pass.
- [ ] M2: complete the Identity vertical slice described below. Implementation is complete; PostgreSQL integration rerun and browser acceptance remain pending.
- [ ] M3: Groups membership, ownership and invitation vertical slice with UI. Implementation is complete; PostgreSQL integration rerun and browser acceptance remain pending.
- [ ] M4: persisted/idempotent Chat, SignalR subscriptions and responsive UI. Implementation is complete; PostgreSQL integration rerun and browser acceptance remain pending.
- [ ] M5: Events, RSVP, concurrency and UI. Implementation is complete; PostgreSQL integration rerun and browser acceptance remain pending.
- [ ] M6: CI, Docker flow, integration/E2E/browser QA and security review.
- [ ] M7: reconcile runbooks/API/database/realtime/security/roadmap docs and final evidence.
- [ ] M8: playable Werewolf vertical slice with authoritative game engine, secure realtime state, LiveKit voice and responsive UI. Implementation is complete; PostgreSQL integration rerun, real media and multi-browser acceptance remain pending.
- [ ] M9: guest-session Stranger Chat vertical slice with safe random matching, persisted/idempotent text messages, realtime notifications, block/report controls and a mobile-first anonymous entry experience.
- [ ] M10: application-wide security hardening. Audit HTTP/SignalR authorization paths, enforce production transport/key/host prerequisites, add private-response headers, normalize antiforgery failures, close Stranger Chat privacy/moderation gaps, scan dependencies/secrets and record regression evidence.
- [ ] M11: professional UI/UX refresh. Unify the visual system and interaction states, upgrade the authenticated shell/navigation, improve mobile ergonomics and responsive desktop layouts, then verify all frontend quality gates and available browser widths.
- [ ] M12: emoji and sticker messages for authenticated group Chat. Implementation and PostgreSQL integration are complete; physical mobile/desktop visual acceptance remains pending.

## M12 Chat emoji and sticker messages

### Acceptance criteria

- Text messages continue to accept plain text up to 2,000 characters; the composer can insert curated emoji at the current caret without using HTML rendering.
- Sticker messages persist `Kind=Sticker` plus one bounded allow-listed code. Arbitrary URLs, HTML, unknown codes and blank payloads are rejected by Application validation and Domain invariants.
- The existing `(GroupId, SenderUserId, ClientMessageId)` idempotency key compares both kind and content; changing either on a retry returns 409.
- History and SignalR include the message kind. PostgreSQL stores the kind in the Chat-owned schema with a safe `Text` default for existing rows.
- Angular renders known stickers from a local catalog, provides keyboard-labelled emoji/sticker controls, and preserves pending/sent/failed retry behavior on small screens.

Each milestone is complete only after its recorded checks pass. Optional CodeGraph or upstream skills do not block application work.

## M10 Application-wide security hardening

### Acceptance criteria

- Production startup fails closed when HTTPS, explicit allowed hosts or persistent Data Protection keys are not configured; forwarded headers are trusted only from explicitly configured proxies.
- OpenAPI/Swagger stays Development-only. API responses set defensive content/frame/referrer headers, and private API data is marked `no-store`.
- Every HTTP mutation returns a stable 400 ProblemDetails response for an invalid antiforgery token instead of leaking through the unexpected-error path.
- Identity and guest cookies remain HttpOnly and become Secure in HTTPS-required environments; rate-limit partition keys do not retain raw network addresses or guest credentials.
- Stranger Chat does not expose its internal guest-session ID. Its SignalR connection resolves authorization through MediatR, is throttled, and never accepts an Identity principal as guest authority.
- Reporting a stranger conversation is idempotent per reporter, ends an active conversation immediately and notifies both realtime subscribers without exposing enforcement details.
- Local PostgreSQL is not bound to every LAN interface. Production runbooks continue to require a private database and TLS edge.
- Regression tests cover headers, antiforgery behavior, guest metadata privacy and report termination/idempotency; backend/frontend builds and relevant test suites are recorded in `docs/verification.md`.

## M2 Identity vertical slice

### Ownership and acceptance criteria

- The Identity module exclusively owns the `identity` PostgreSQL schema, its `IdentityDbContext`, Identity tables and schema-local migration history.
- Registration accepts only email, password and display name. It never accepts or assigns roles, and duplicate normalized email is rejected.
- Login uses ASP.NET Core Identity normalization, password hashing and lockout. Authentication is a same-origin HttpOnly cookie; browser tokens are never stored in local storage.
- `GET /api/v1/auth/me` returns the authenticated account. Logout removes the current cookie. Password change requires the current password, rotates the security stamp and refreshes only the current session so other sessions become invalid.
- Every mutation requires the Angular-compatible antiforgery cookie/header pair and auth endpoints use the dedicated rate-limit policy.
- Validation and expected failures use stable ProblemDetails codes without leaking account existence, password hashes, cookies, tokens or infrastructure details.
- The Angular UI provides real register, login, profile/change-password and logout flows with typed services, route protection, loading, validation and error states on small screens.
- There is no password reset, confirmation-email action or fake success. Documentation states that open public registration is unsuitable until an email provider and recovery/verification flow exist.

### Delivery steps

1. Add MediatR commands/queries and handlers, a FluentValidation pipeline behavior, service ports and public account contract.
2. Add ASP.NET Core Identity user/store configuration, module-owned DbContext, PostgreSQL mapping, migration and executable migration runner.
3. Add versioned Minimal API endpoints, cookie/authorization middleware, antiforgery bootstrap and uniform ProblemDetails mapping.
4. Add Angular auth state, guard, typed API service and lazy register/login/profile screens, then connect the application shell.
5. Add backend unit/integration coverage and frontend component/service coverage, then run format, build, test, migration validation and browser checks where the local environment permits.
6. Perform an Identity-focused access-control/privacy review and update API, database, security, progress and verification documentation with evidence and remaining limits.

## M3 Groups vertical slice

### Ownership and acceptance criteria

- The Groups module exclusively owns the `groups` PostgreSQL schema, `GroupsDbContext`, memberships, invitations, audit records and schema-local migration history. User IDs cross the Identity boundary only through contracts; no cross-schema foreign key or query is allowed.
- An authenticated user can create a private group, rename a group they own, list their groups and view members only when they belong to the group.
- Membership is unique per group/user and has `Owner` or `Member` role. Creation is transactional with one owner; a filtered unique database index prevents a second owner.
- Owners can create expiring invitations, list/revoke them, remove members and atomically transfer ownership with an expected version. Sensitive operations persist an audit record without raw invitation tokens.
- Invitation tokens have at least 256 bits of randomness. Only SHA-256 hashes are stored; the raw token is returned once and never logged. Expired/revoked/unknown tokens share a non-disclosing unavailable result.
- Invitation preview never creates membership. The Angular link page removes the raw token from the address bar after reading it, previews separately and issues a protected POST only after explicit confirmation. Repeated joins are idempotent.
- Members can leave. The current owner cannot leave or remove themselves until transferring ownership. Group deletion is not exposed in the MVP.
- Angular provides real group list/create/detail/member/invite/transfer/remove/leave journeys with typed services, loading/empty/error/pending states and mobile-safe controls.

### Delivery steps

1. Add framework-free Groups domain entities/invariants, Application result types, MediatR requests/handlers/validators and focused ports.
2. Add the module-owned EF Core model, authorization-aware Infrastructure services, strong invite-token handling, transactional ownership transfer, audit persistence and migration.
3. Register Groups in the host/migrator and expose authenticated, antiforgery-protected versioned endpoints with stable ProblemDetails and invite rate limiting.
4. Replace the Groups placeholder with typed Angular state/screens for create/list/manage/invite acceptance, then add focused frontend tests.
5. Add domain/use-case/API integration coverage for authorization, expiry/revoke, duplicate join and ownership concurrency; run all available quality gates and record Docker/browser blockers honestly.
6. Complete a Groups-focused access-control/token review and update API, database, security, progress and verification documentation.

## M4 Chat vertical slice

### Ownership and acceptance criteria

- Chat exclusively owns the `chat` schema, `ChatDbContext`, messages and migration history. Group and user data are accessed only through Contracts.
- A group has one implicit shared text conversation. Only current members can read, send or subscribe; membership removal revokes an existing realtime subscription.
- REST send accepts `{ clientMessageId, content }`, rejects blank or over-2,000-character content and uses `(groupId, senderUserId, clientMessageId)` as an idempotency key. Reuse with different content returns 409.
- PostgreSQL commit happens before the best-effort SignalR notification. Reconnect queries the authoritative database and clients deduplicate by message ID; exactly-once delivery is not claimed.
- History uses a stable opaque time-plus-ID cursor, accepts mutually exclusive `before` or `after`, defaults to 50 and caps at 100.
- Angular provides group selection, loading/empty/error/reconnecting states, plain-text rendering, optimistic pending/sent/failed messages and retry with the original client message ID.

### Delivery steps

1. Add the framework-free message aggregate, Application result/ports, MediatR commands/queries/handlers and validators.
2. Add EF Core persistence, cursor codec, membership/profile contract adapters, idempotency handling, SignalR hub/publisher/connection registry and chat migration.
3. Register Chat in the host and migrator; expose authenticated REST endpoints with antiforgery/rate limits and the authenticated hub endpoint.
4. Add typed Angular REST/realtime services and replace the placeholder with the responsive optimistic chat screen.
5. Add focused unit/integration/frontend tests, run available quality gates and record PostgreSQL/browser environment blockers honestly.
6. Review resource authorization, message privacy/logging, realtime revocation and update API/database/realtime/security/progress/verification documentation.

## M5 Events vertical slice

### Ownership and acceptance criteria

- Events exclusively owns the `events` schema, `EventsDbContext`, events, RSVP history, audit records and schema-local migration history. Group membership and user profiles cross boundaries only through Contracts.
- Current group members can list and view events. Non-members receive hidden 404 responses. Current members can create events whose start time is in the future.
- Creator or current group owner can edit an active event and transition `Open -> Confirmed/Cancelled` or `Confirmed -> Cancelled`; `Cancelled` is terminal. Edit and transition require the current application-managed UUID version and stale writes return 409.
- RSVP values are exactly `Going` or `NotGoing`; only `Open` accepts changes. A current member without an RSVP remains `Unanswered` and is never inferred as `NotGoing`.
- RSVP uses one row per event/user with atomic upsert. Former members lose event access, while their historical RSVP remains visible to current members with `isCurrentMember=false`.
- Title, description and location are plain text with server/domain limits. Angular provides real group selection, create/list/detail/edit/status/RSVP flows and explicitly explains the RSVP lock rule.

### Delivery steps

1. Add framework-free Event/RSVP/status invariants, Application models/results/ports, MediatR commands/queries/handlers and validators using injected `TimeProvider` through Infrastructure.
2. Add module-owned EF Core mappings, indexes, unique RSVP constraint, concurrency token, transactional audit for confirm/cancel and initial Events migration.
3. Register Events in the host and migrator; expose authenticated, antiforgery-protected versioned endpoints with stable ProblemDetails mappings.
4. Replace the Events placeholder with typed Angular services and responsive create/list/detail/manage/RSVP UI using existing Campfire design tokens.
5. Add unit, PostgreSQL integration and frontend service coverage; run format/build/test/migration checks and record environment blockers.
6. Perform an Events access-control/privacy review and update API/database/security/progress/verification documentation.

## M8 Werewolf playable vertical slice

### Ownership, rules and acceptance criteria

- Werewolf owns the `werewolf` schema, room/player/game/role/action/vote/event data, its DbContext and migration history. Identity information crosses only through `Identity.Contracts`.
- Authenticated users can list public lobbies, create public/private rooms, join by code, ready, leave a lobby and reconnect to a running game. A lobby host can update settings, remove a participant and start only when 6–20 players are ready; lobby host ownership transfers deterministically when the host leaves.
- The first playable ruleset contains Villager, Werewolf, Seer, Guard and Witch. The server assigns roles, reveals only the caller's private role/result and evaluates all actions and victory conditions. No client payload can select or infer another player's role.
- The authoritative phase order is `Lobby -> Werewolves -> Seer -> Guard -> Witch -> DayDiscussion -> DayVoting`, repeating until Villagers or Werewolves win. Every phase has a server UTC deadline and a deterministic timeout fallback so a disconnected player cannot block a match.
- Night attack, investigation, protection, potion use and day voting are phase/role/alive checked. Each actor has one effective action per phase; `clientActionId` makes retries idempotent. Dead players cannot act or vote.
- REST owns mutations and PostgreSQL commits before SignalR sends a version/state-changed notification. Reconnect fetches the caller-filtered snapshot from REST. Multiple rooms are isolated by database keys and SignalR/LiveKit room names.
- Voice uses self-hosted LiveKit. Backend-minted, short-lived tokens scope users to a phase-specific public, werewolf or optional dead room with server-derived publish/subscribe grants. Phase changes close the prior LiveKit rooms server-side; UI controls never provide the security boundary. Audio is not recorded or retained.
- Angular provides public-room discovery, create/join, lobby/readiness/settings, private role/action, day voting, server deadline, reconnect and persistent voice controls using Campfire design tokens at mobile and desktop widths.

### Delivery steps

1. Add the framework-free room/game aggregates, role registry, deterministic phase engine, action/vote invariants and focused unit tests.
2. Add Application results/models/ports and separate MediatR requests, handlers and validators for every HTTP use case.
3. Add module-owned EF Core mappings, constraints, indexes, transaction/concurrency/idempotency handling, initial migration and due-phase worker.
4. Add authenticated REST, SignalR and LiveKit adapters, post-commit notifications, server-side voice revocation and host moderation.
5. Add typed Angular room/game/realtime/voice services and lazy mobile-first lobby/game screens with safe private/public projections.
6. Add PostgreSQL/realtime/privacy/frontend tests, including a six-client full-match scenario driven by an injected test clock; run all available checks and document real LiveKit/Docker/browser blockers without claiming unexecuted acceptance. The tests are implemented and discovered, but PostgreSQL assertions remain blocked locally because Docker is unavailable.

## M9 Stranger Chat guest vertical slice

### Product boundary and module ownership

- Add a new `StrangerChat` module owning Domain, Application, Infrastructure, Presentation, Contracts, the `stranger_chat` PostgreSQL schema, its `StrangerChatDbContext` and schema-local migration history. It must not reuse the authenticated group Chat entities or query Identity/Groups tables.
- The unauthenticated landing experience offers `Gặp người lạ` and `Đăng nhập`. Authenticated users continue into the existing private Campfire shell; the first Stranger Chat MVP is guest-only so account identity, email, groups and profile data can never leak into a stranger conversation.
- A guest is not an untracked browser. The server creates a short-lived `GuestSession` backed by an opaque cryptographically random token in a Secure, HttpOnly, SameSite cookie; only its hash is persisted. The token never appears in URLs, browser storage, logs, SignalR query strings or API responses. The session also owns the guest's selected `Male|Female|Other` gender and `Any|Male|Female|Other` matching preference.
- Present the product as pseudonymous rather than “anonymous tuyệt đối”. Require explicit community-rules acceptance and an 18+ confirmation before queueing in the first public MVP. Age confirmation is a product gate, not identity verification, and that limitation must be visible in UI/policy copy.
- MVP scope is random 1:1 text chat, temporary nickname, queue/cancel, match, reconnect grace, end/skip, block and report. Exclude images, files, URLs, voice, video, location, profile search, permanent stranger history and algorithmic recommendations.

### Guest session and abuse controls

- Nicknames are trimmed plain text, 2–24 characters, server validated and never accepted as trusted HTML. A guest session has created/last-seen/expiry/revoked timestamps and rotates its raw token when renewed.
- Guest-session creation, queue joins, messages, skips and reports have separate rate-limit policies. Limits use session identity plus a privacy-preserving, rotating HMAC of the source IP; raw IP addresses and user agents are not persisted or logged.
- Repeated violations can revoke the session and temporarily deny a rotating network fingerprint. Document that this is abuse mitigation, not durable user identity and can have false positives on shared networks.
- Every mutating HTTP endpoint requires the existing antiforgery cookie/header pair. Add an isolated guest authentication scheme/policy that produces only a guest-session claim; it must not satisfy Identity authorization and an Identity cookie must not implicitly reveal the account to Stranger Chat.
- Block is immediate and idempotent: it ends the conversation, prevents the same two valid sessions from rematching for the block retention window and removes both live subscriptions. Report also ends the conversation by default, accepts only bounded reason codes plus an optional bounded note and cannot be spammed repeatedly for the same conversation.
- Do not log nicknames, message bodies, guest cookies, raw session tokens, raw IPs, report notes or transcript contents. ProblemDetails may contain only stable codes and trace IDs.

### Domain model and lifecycle

- `GuestSession`: `Id`, `TokenHash`, nickname, rules/age acknowledgement timestamps, status, created/last-seen/expiry/revoked timestamps.
- `MatchmakingTicket`: one active ticket per session, queued timestamp, lease expiry and optional coarse topic key reserved for a later controlled rollout. MVP matching uses the single default pool.
- `StrangerConversation`: two distinct participant session IDs, status `Active|Ended`, created/ended timestamps, end reason and application-managed UUID version.
- `StrangerMessage`: conversation, sender session, `clientMessageId`, bounded content, server UTC timestamp and UUID ID. A unique `(ConversationId, SenderSessionId, ClientMessageId)` constraint enforces retry idempotency; changed-payload reuse returns 409.
- `StrangerBlock`: blocker, blocked session and expiry. Store session IDs only; never expose either identifier to the peer.
- `StrangerReport`: reporter, conversation, reason code, optional bounded note, created timestamp and review status. A report places a legal/moderation hold on the minimum required conversation rows; ordinary ended conversations expire independently.
- Queue states are `Idle|Waiting|Matched`. Conversation states are server authoritative. Only an active participant may read or send. Ending, skipping, blocking, report submission and expiration are safe under retries.
- Matchmaking uses one module-local PostgreSQL transaction with row locking (`FOR UPDATE SKIP LOCKED` or an equivalent reviewed strategy) so one guest cannot be assigned twice and two workers cannot create duplicate conversations. Block pairs and expired/revoked sessions are excluded before commit. A candidate is eligible only when both guests' preferences accept the other guest's gender; `Any` accepts all three supported gender values.

### Retention and cleanup defaults

- Guest sessions expire after 24 hours of inactivity. Waiting tickets use a short renewable lease and disappear after disconnect/heartbeat timeout so stale browsers do not poison the queue.
- Ordinary message/conversation data is deleted 24 hours after a conversation ends. Block-pair data is retained for 30 days. Reported conversation evidence is retained for 90 days with access limited to an operational moderation path; these defaults must be configurable and reflected in the privacy notice before public launch.
- A module-owned background cleanup service performs bounded batches using an injected `TimeProvider`, records counts/IDs rather than content and remains safe when interrupted or run repeatedly.

### API and realtime contract

- `POST /api/v1/stranger/session`: anonymous + XSRF; creates/renews the guest cookie after `{ nickname, gender, genderPreference, confirmsAdult }` validation and returns non-sensitive session metadata.
- `GET /api/v1/stranger/session`: guest policy; returns nickname, expiry and current queue/conversation state without returning the session ID/token.
- `DELETE /api/v1/stranger/session`: guest + XSRF; leaves the queue, ends any active conversation, revokes the session and expires the cookie idempotently.
- `POST /api/v1/stranger/matchmaking`: guest + XSRF; joins the queue idempotently and may return an immediate match. `DELETE` cancels only a waiting ticket.
- `GET /api/v1/stranger/conversations/current`: guest; returns the current caller-filtered conversation, peer nickname, state and stable opaque history cursor.
- `GET /api/v1/stranger/conversations/{conversationId}/messages?before=&after=&limit=`: participant; uses the existing stable time-plus-ID pagination semantics, default 50 and maximum 100.
- `POST /api/v1/stranger/conversations/{conversationId}/messages`: active participant + XSRF; persists `{ clientMessageId, content }` through REST before realtime publication. Content must contain a non-whitespace character, be at most 1,000 characters and reject URLs in MVP.
- `POST /api/v1/stranger/conversations/{conversationId}/end`: participant + XSRF; ends without requeue. `POST .../skip` atomically ends and creates a fresh matchmaking ticket.
- `POST .../block` and `POST .../reports`: participant + XSRF; never disclose whether enforcement affected another active session.
- `/hubs/stranger` authenticates only the guest cookie. It sends `MatchFound`, `ConversationEnded` and post-commit `MessageCreated` notifications containing public conversation/message identifiers and no token, network, report or moderation data. Reconnect always reconciles through REST; exactly-once delivery is not promised.
- All HTTP use cases follow `endpoint -> ISender -> command/query handler -> injected Application interface -> Infrastructure implementation -> EF Core/PostgreSQL`. Hub methods dispatch through `ISender` and never access DbContext/services directly.

### Angular experience

- Add lazy public routes for guest welcome/rules, matchmaking and active conversation. Do not show the authenticated bottom navigation in guest mode; keep a clear `Đăng nhập` action without interrupting an active guest chat.
- Welcome collects nickname, rules acknowledgement and 18+ confirmation with accessible validation. Matchmaking displays waiting duration, cancel and retry states; never fake a match or populate a bot participant.
- Conversation displays the peer's temporary nickname, pseudonymity/retention notice, plain-text messages, optimistic pending/sent/failed retry using the same `clientMessageId`, reconnecting state and prominent `Bỏ qua`, `Kết thúc`, `Chặn`, `Báo cáo` controls.
- Destructive controls use a compact confirmation sheet/dialog with keyboard focus management and 44px touch targets. Report reasons are predefined and the optional note is length bounded.
- On reload/reconnect, restore state only from the HttpOnly guest cookie and server APIs. Do not put guest identifiers, tokens or transcripts in localStorage/sessionStorage. Verify 360/390/430px, desktop, keyboard appearance, long nicknames/messages and safe-area behavior.

### Delivery sequence and verification gates

1. Record ADR 009 for guest identity, retention, matchmaking transaction and the deliberate separation from Identity/group Chat. Update the privacy/security threat model before creating public endpoints.
2. Add framework-free domain state/invariants plus unit tests for session expiry, queue/conversation transitions, block exclusion and idempotent end/skip behavior.
3. Add Application commands/queries, one handler/validator per use case and narrow ports for session, matchmaking, conversation, moderation, realtime and cleanup operations.
4. Add PostgreSQL entities/configurations/indexes/constraints, the `stranger_chat` migration, transactional matcher, token hashing, cleanup worker and migrator registration. Review generated SQL and blank-database migration behavior.
5. Add guest authentication/cookie handling, rate limits, ProblemDetails mappings, thin REST endpoints and the isolated SignalR hub; persist before publish and propagate cancellation.
6. Add typed Angular guest state/API/realtime services and lazy mobile-first screens with real queue, error, reconnect, pending and moderation states.
7. Add PostgreSQL integration tests for two-client matching, concurrent double-match prevention, outsider isolation, cookie/token secrecy, message idempotency, skip/requeue, block/no-rematch, report retention and expiry cleanup. Add SignalR reconnect/reconciliation and frontend service/component tests.
8. Run backend format/build/unit/architecture/integration checks, frontend lint/test/build, security scans and browser QA. Load-test at 25, 50 and 100 simultaneous conversations before selecting the first EC2/RDS size; record p95 match/send latency, database connections, CPU, memory and error/report rates.
9. Launch behind a feature flag to a small invite cohort. Public release requires moderation ownership, a privacy/retention notice, support contact, abuse alerting, database backups and verified budget/usage alarms; Free Tier status alone is not a launch criterion.

### Definition of done and explicit non-goals

- Done means two real guest browsers can create isolated sessions, match exactly once, exchange persisted/idempotent text messages, reconnect, skip/end, block/report and expire according to policy, with server-enforced access and reproducible PostgreSQL/browser evidence.
- Security review must find no route from a guest principal into authenticated group/event/game resources, no account disclosure to a peer, no transcript/token logging and no GET endpoint with mutation semantics.
- MVP does not include media, voice/video, links, location, age-range filters, minors, public profiles, friend requests, account conversion, AI moderation, automated shadow bans, Redis, a message broker or horizontal multi-instance SignalR. Gender preference matching was added by explicit product request and remains limited to the fixed `Male|Female|Other` values with an `Any` preference.

## M10 Chat interaction completion

### Acceptance criteria

- Group Chat and Stranger Chat keep separate module ownership, schemas and authorization boundaries while exposing the same safe interaction concepts: text/sticker messages, same-conversation replies and one basic reaction per caller per message.
- A reply can reference only an existing message in the same group/conversation. API projections contain only a bounded plain-text/sticker preview and sender label; deleted or inaccessible targets are never resolved across a boundary.
- Stickers and reactions use fixed server allowlists. Arbitrary URLs, HTML and user-supplied sticker assets are rejected. Repeating the same reaction is idempotent; changing or removing it updates the caller's single row.
- Message-send idempotency compares kind, content and reply target. Reusing a `clientMessageId` with a different payload returns 409.
- REST persists every send/reply/reaction before SignalR emits a change notification. Reconnect reloads from REST; exactly-once realtime delivery is not promised.
- Both Angular chat screens show server time, reply context, aggregate reactions and optimistic delivery state, support the local sticker catalog, scroll to a newly arrived message and send with Enter while Shift+Enter inserts a newline.
- All content remains plain text. Backend membership/participant checks protect every message and reaction mutation; UI route state is not treated as authorization.

### Delivery steps

1. Extend both Domain/Application slices with reply invariants, sticker/reaction allowlists, MediatR commands/handlers/validators and narrow injected service ports.
2. Add module-owned reply columns and reaction tables, constraints/indexes and migrations in `chat` and `stranger_chat`.
3. Add thin antiforgery-protected reaction endpoints and post-commit realtime change notifications.
4. Complete typed Angular models/services and mobile-first interaction UI, including auto-scroll and desktop keyboard behavior.
5. Add focused domain, API and frontend tests; run backend/frontend quality gates and record exact results.
6. Review authorization, privacy/logging, HTML rendering and cross-module boundaries, then update progress and verification documentation.

## M16 Unified professional chat experience

### Acceptance criteria

- Group Chat and Stranger Chat keep their existing authorization and persistence boundaries, but use the same compact visual language for bubbles, replies, reactions, stickers and composing.
- A short press exposes a small action affordance; long press opens the reaction/reply tray and suppresses the browser context menu. Supported mobile devices provide a brief haptic acknowledgement without making vibration a requirement.
- Incoming messages auto-follow only while the reader is near the bottom. While reading history, the viewport is preserved and a visible unread counter returns to the latest message. Sending a local message always follows it.
- Loading older Group Chat history preserves the reader's visual position. Scrolling closes any floating message action tray.
- The composer is thumb-friendly, icon-led, keyboard accessible, supports Enter to send and Shift+Enter for a newline, and keeps emoji/sticker pickers above the mobile keyboard area.
- Both screens remain token-driven in light/dark themes and compile inside the configured component-style budgets.

### Delivery steps

1. Add shared follow/unread viewport behavior to both chat screens without changing backend contracts.
2. Replace oversized chat headers and composers with compact responsive conversation surfaces.
3. Harden long-press behavior and accessible labels for reaction, reply, emoji, sticker and send controls.
4. Run frontend formatting, unit tests, production build and whitespace verification; record physical-device visual QA separately.
