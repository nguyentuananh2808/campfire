# Verification evidence

All times use Asia/Saigon. A check is marked passed only when it was actually executed successfully.

## Learning Clean Architecture refactor — 2026-10-27

- Passed: `dotnet restore backend/src/Host/Campfire.Api/Campfire.Api.csproj --force-evaluate --disable-parallel -m:1` (cập nhật lock files thành công).
- Passed: `dotnet build backend/src/Host/Campfire.Api/Campfire.Api.csproj --no-restore -m:1` — 0 warnings, 0 errors.
- Passed: `dotnet test backend/tests/Campfire.UnitTests/Campfire.UnitTests.csproj --no-restore -m:1` — 32/32.
- Passed: `dotnet test backend/tests/Campfire.ArchitectureTests/Campfire.ArchitectureTests.csproj --no-restore -m:1` — 4/4.
- Passed: `dotnet ef migrations has-pending-model-changes ... --context LearningDbContext --no-build` — no pending model changes.
- Blocked: `dotnet format` trong sandbox không kết nối được Roslyn build-host named pipe (`UnauthorizedAccessException`); build compiler/analyzers vẫn pass sạch.
- Not run: PostgreSQL integration/migration từ database trắng vì Docker engine chưa được xác nhận trong phiên này.

| Date | Check | Result |
|---|---|---|
| 2026-10-15 | `git status`, repository inventory | Repository initialized; all scaffolded files remain untracked because no baseline commit exists. No user-owned tracked changes were overwritten. |
| 2026-10-15 | toolchain inventory | Repository-local .NET SDK 10.0.112, Node v24.18.0 and npm 11.16.0 available. Docker executable/engine unavailable. |
| 2026-10-15 | `dotnet restore backend/Campfire.slnx --locked-mode --disable-parallel --disable-build-servers -m:1` | Passed for all 29 projects. |
| 2026-10-15 | `dotnet build backend/Campfire.slnx --no-restore --disable-build-servers -m:1` | Passed after the final Groups/token/rate-limit changes: 0 warnings, 0 errors. |
| 2026-10-15 | `dotnet format backend/Campfire.slnx --no-restore --verify-no-changes` | Passed. Roslyn named-pipe access required execution outside the sandbox. |
| 2026-10-15 | `dotnet test backend/tests/Campfire.UnitTests/Campfire.UnitTests.csproj --no-build --no-restore` | Passed: 4/4. Adds Groups single-owner creation/version and invitation hash/expiry invariant coverage to the Identity MediatR tests. |
| 2026-10-15 | `dotnet test backend/tests/Campfire.ArchitectureTests/Campfire.ArchitectureTests.csproj --no-build --no-restore` | Passed: 4/4. Includes Clean Architecture project boundaries and mandatory module MediatR references. |
| 2026-10-15 | `dotnet ef migrations has-pending-model-changes` for `IdentityDbContext` and `GroupsDbContext` | Passed for both contexts: no model changes exist beyond `InitialIdentity` and `InitialGroups`. The Groups migration was inspected for schema ownership, UTC columns, membership uniqueness, one-owner filter, token-hash uniqueness and query indexes. |
| 2026-10-15 | `dotnet test backend/tests/Campfire.IntegrationTests/Campfire.IntegrationTests.csproj --no-build --no-restore` | Failed 4/4 during fixture construction because Docker endpoint `npipe://./pipe/docker_engine` is unavailable. Two Groups tests are implemented for PostgreSQL 18 and cover hidden-resource authorization, non-consuming preview, raw-token hashing, duplicate join, revocation, owner-leave conflict and concurrent owner-transfer winner. No integration assertion executed, so this is not a passing result. |
| 2026-10-15 | `npm ci` | Passed: 281 packages installed, 0 vulnerabilities. npm reported four install scripts awaiting allow-list review; none was auto-approved. |
| 2026-10-15 | `npm run build` | Passed with Groups list/detail/invite lazy screens; production output generated at `frontend/dist/campfire-web` (initial bundle 276.34 kB). |
| 2026-10-15 | `npm test -- --watch=false` | Passed: 4/4. Groups coverage verifies preview and join are distinct antiforgery-protected POST requests. |
| 2026-10-15 | `npm run lint` / Prettier source check | Passed for all TypeScript, HTML and SCSS source files. The repository lint script intentionally maps to the configured Prettier check; no ESLint dependency is installed. |
| 2026-10-15 | API localhost smoke test | Passed before final documentation: API root 200, antiforgery bootstrap 204, anonymous `/auth/me` 401 and live health 200. The final build also passed after 401/403 were upgraded to ProblemDetails. |
| 2026-10-15 | Identity security/architecture source review | Passed: endpoints use `ISender`; handlers use the injected `IIdentityService`; no registration role field/assignment exists; auth tokens are not written to local/session storage; no password/token/cookie logging was found. Theme preference is the only application value persisted in local storage. |
| 2026-10-15 | Groups security/architecture source review | Passed: all HTTP use cases dispatch through `ISender`; handlers depend on Application ports; authorization is checked against resource membership in Infrastructure; no raw invite token persistence/logging exists; link tokens use URL fragments; preview cannot join; mutations require antiforgery; sensitive actions persist token-free audit records. |
| 2026-10-15 | legacy-name and unfinished-code scan excluding dependencies/generated output | Passed: the legacy product name is absent and no executable unfinished placeholder or simulated-success path was found. |
| 2026-10-15 | responsive browser QA | Not run: the in-app browser timed out against localhost and Chrome/Edge automation providers were unavailable. Identity and Groups flows at 360/390/430px and desktop remain required before M2/M3 acceptance. |
| 2026-10-15 | `npm view @microsoft/signalr version` and `npm install @microsoft/signalr@10.0.11 --save-exact` | Registry reported 10.0.11 as current (10.0.12 does not exist); installed and pinned 10.0.11. Audit reported 0 vulnerabilities. Microsoft documents the npm client and automatic reconnect API. |
| 2026-10-15 | final Chat backend build | Passed for all 29 projects with `-m:1`: 0 warnings, 0 errors. Parallel MSBuild was unstable in this sandbox, so the reproducible command is serialized. |
| 2026-10-15 | final Chat unit and architecture tests | Passed: unit 6/6 (including blank/length/plain-text message invariants); architecture 4/4. Testhost named-pipe access required execution outside the sandbox. |
| 2026-10-15 | Chat migration model-drift check | Passed: `ChatDbContext` has no model changes beyond `InitialChat`. Migration was inspected for `chat` ownership, `timestamptz`, 2,000-character content, idempotency uniqueness and group/time/ID cursor index. |
| 2026-10-15 | Chat PostgreSQL integration suite | Failed 5/5 at shared fixture construction because Docker endpoint `npipe://./pipe/docker_engine` is unavailable. The new Chat test is present for member isolation, REST idempotent retry, changed-payload 409 and single-row persistence, but no assertion executed. |
| 2026-10-15 | final frontend checks | Passed after Chat: production build (initial 289.46 kB; Chat lazy chunk 69.36 kB), Vitest 6/6, and Prettier lint. |
| 2026-10-15 | Chat security/architecture source review | Passed: HTTP endpoints dispatch via `ISender`; handlers use `IChatMessageService`; persistence precedes broadcast; membership gates REST/hub; removal revokes live group access; messages are not logged; Angular uses text interpolation and deduplicates server IDs. Multi-instance realtime revocation remains explicitly out of scope. |
| 2026-10-15 | Chat responsive/browser QA | Not run: Docker/backend data flow and browser automation remain unavailable. The responsive source includes mobile breakpoints and required loading/empty/error/reconnecting/pending/failed states, but this is not visual acceptance evidence. |
| 2026-10-16 | Events locked restore and backend build | Passed for all 29 projects: 0 warnings, 0 errors. Events uses the existing pinned MediatR/FluentValidation/EF/Npgsql packages; no new backend package family was introduced. |
| 2026-10-16 | Events unit and architecture tests | Passed: unit 9/9, architecture 4/4. New domain tests cover future-time enforcement, legal/stale state transitions and cancelled-event edit lock. |
| 2026-10-16 | Events migration model-drift check | Passed: `EventsDbContext` has no changes beyond `InitialEvents`. Migration was inspected for schema ownership, UTC columns, RSVP composite key, concurrency version, internal foreign keys, audit index and group/start/ID query index. |
| 2026-10-16 | Events frontend build/tests/lint | Passed: production build without budget warnings; Vitest 8/8; Prettier lint passed. The lazy Events page implements loading/empty/error/conflict, create/edit/status/RSVP and former-member states. |
| 2026-10-16 | Events PostgreSQL integration suite | Failed 6/6 at shared fixture construction because Docker endpoint `npipe://./pipe/docker_engine` is unavailable. The Events test exists for outsider hiding, creator/owner permissions, concurrent version conflict, RSVP lock and retained former-member history, but no assertion executed. |
| 2026-10-16 | Events security/architecture source review | Passed: endpoints use `ISender`; handlers depend on `IEventService`; every resource path rechecks current membership; creator does not bypass membership; mutations require XSRF; status audit is durable; RSVP/status race is serialized with a PostgreSQL row lock; no event body logging or unsafe HTML rendering was found. |
| 2026-10-16 | Events responsive/browser QA | Not run: Docker-backed API state and an available browser automation provider are still unavailable. Source breakpoints target mobile and desktop, but source inspection is not visual acceptance evidence. |
| 2026-10-16 | Werewolf dependency verification and install | Official/current sources verified `Livekit.Server.Sdk.Dotnet` 1.2.3, `livekit-client` 2.22.4 and LiveKit Server v1.13.10. Locked NuGet restore passed for all 34 projects; npm installed 13 added packages and reported 0 vulnerabilities. |
| 2026-10-16 | Werewolf backend format/build | Passed: `dotnet format` and final `--verify-no-changes`; solution build succeeded with 0 warnings and 0 errors. Roslyn named-pipe checks required execution outside the sandbox. |
| 2026-10-16 | Werewolf unit and architecture tests | Passed: unit 22/22, architecture 4/4. Added deck/role metadata, domain-enforced phase order, stale/out-of-order transition, host-version rotation, night attack/protect/heal/poison resolution, blank/plurality/tied voting and both faction win-condition coverage. |
| 2026-10-16 | Werewolf migration model-drift check | Passed: `WerewolfDbContext` has no changes beyond `InitialWerewolf`. Migration was inspected for schema-local foreign keys, UTC timestamps, unique room codes/seats, action/vote idempotency and due-phase/event indexes. |
| 2026-10-16 | Werewolf frontend build/tests/lint | Passed: production build without warnings; Vitest 10/10; Prettier lint passed. Werewolf is a lazy route and the LiveKit client remains in its lazy chunk rather than the initial bundle. |
| 2026-10-16 | Werewolf PostgreSQL integration suite | Failed 8/8 at shared fixture construction because Docker endpoint `npipe://./pipe/docker_engine` is unavailable. The compiled scenarios cover private-room join/readiness/start, outsider hiding, role deck/privacy, Wolf-only night voice, concurrent identical/changed-payload action retries, in-match host transfer and a full two-round game ending in a Village victory through real HTTP plus an injected test clock; no integration assertion executed. |
| 2026-10-16 | Werewolf security/realtime source review | Passed: HTTP endpoints dispatch through `ISender`; handlers use `IWerewolfService`; snapshots are caller-filtered; a SignalR connection drops its old room subscription before changing rooms; SignalR emits no role/action/vote payload; late/dead/wrong-role/out-of-order actions are rejected; changed idempotency payloads conflict; role/action text and voice tokens are not logged; LiveKit grants are short-lived, microphone-only and phase-room scoped; moderation/phase changes close the old room server-side. |
| 2026-10-16 | Werewolf browser/voice acceptance | Not run: Docker, a reachable LiveKit/TURN deployment and browser automation/multiple physical clients are unavailable. A complete match, speaking indicators, microphone/speaker switching, per-user volume and enforced public/Wolf/dead channel revocation still require real multi-device verification. |
| 2026-10-16 | Werewolf continuation frontend checks | Passed after role metadata and server-grant-aware microphone UI: production build without warnings (initial 287.80 kB, lazy Werewolf 578.05 kB), Vitest 10/10 and Prettier lint. Real media/browser acceptance remains not run because the authenticated game state requires the unavailable PostgreSQL/LiveKit runtime. |
| 2026-10-16 | Docker Desktop and local infrastructure startup | Passed: Docker Desktop 4.95.0 / Engine 29.8.2 started; `postgres:18` is healthy on host port 5433 and `livekit/livekit-server:v1.13.10` is running on 7880/7881 plus UDP 50000-50020. PostgreSQL uses the 18-compatible `/var/lib/postgresql` mount and a new `campfire-postgres18-data` volume; the earlier unused volume was preserved. |
| 2026-10-16 | `docker compose ... config --quiet` and Campfire migrator | Passed: Compose configuration is valid and Identity, Groups, Chat, Events and Werewolf migrations all applied successfully to the local PostgreSQL 18 database. |
| 2026-10-16 | Local API runtime smoke | Passed: API started in Development at `http://localhost:5080`; `/health/live` and `/health/ready` both returned HTTP 200 `Healthy`. |
| 2026-10-16 | Development Swagger UI | Passed after enabling Swashbuckle UI against the existing `/api/openapi/v1.json` document: `/swagger/index.html` returned HTTP 200 HTML and the OpenAPI document returned HTTP 200 JSON. API build passed with 0 warnings and 0 errors after restarting the locked local process. |
| 2026-10-16 | Mobile bottom navigation and Chat viewport regression | Passed source checks: authenticated shell renders all four destinations with active-page semantics; navigation reserves safe-area-aware fixed space, uses 52px touch targets and overlays above content; Chat composer stays above navigation and horizontal overflow is clipped. Frontend Prettier lint passed, Vitest passed 10/10 and production build passed. Visual QA at 360/390/430px was attempted but not completed because the in-app browser timed out against localhost and Chrome automation is unavailable. |
| 2026-10-16 | Campfire supplied-logo integration | Passed: the supplied 1024×1024 JPEG is served from `/campfire-logo.jpeg`, referenced by the shell brand, favicon and Apple touch metadata, and copied into the production output. Local asset request returned HTTP 200 `image/jpeg` with the expected 120,587 bytes; frontend lint passed, Vitest passed 10/10 and production build passed. |

## Reproduction commands

```powershell
$env:DOTNET_CLI_HOME='D:\Campfire\.dotnet-home'
.\.dotnet\dotnet.exe build backend\Campfire.slnx --no-restore --disable-build-servers -m:1
.\.dotnet\dotnet.exe test backend\tests\Campfire.UnitTests\Campfire.UnitTests.csproj --no-build --no-restore
.\.dotnet\dotnet.exe test backend\tests\Campfire.ArchitectureTests\Campfire.ArchitectureTests.csproj --no-build --no-restore

Set-Location frontend
npm run build
npm run lint
npm test -- --watch=false
```

The integration suite additionally requires a working Docker engine because it intentionally uses a real PostgreSQL container.

| 2026-10-16 | Stranger Chat backend build | Passed: local .NET 10 build completed with 0 warnings and 0 errors after adding all five module projects and `InitialStrangerChat`. |
| 2026-10-16 | Stranger Chat unit/architecture checks | Passed: UnitTests 25/25 and ArchitectureTests 4/4. Domain checks cover invalid nickname, self-match and blank/oversized messages. |
| 2026-10-16 | Stranger Chat frontend checks | Passed: Angular production build, Vitest 10/10 and full Prettier lint. The lazy Stranger Chat bundle is 14.60 kB raw. |
| 2026-10-16 | Stranger Chat PostgreSQL/browser acceptance | Not run: Docker engine was unavailable. Migration application, concurrent two-client matching, reconnect, block/report and 360/390/430px visual acceptance remain pending. |
| 2026-10-16 | Stranger Chat mobile UI revision | Passed: Prettier lint, Vitest 10/10 and Angular production build. Loading, matching, empty chat, pending/sent/failed, realtime-degraded and safety-action states are represented with 46px+ primary touch targets, safe-area composer placement and reduced-motion handling. Browser visual QA at 360/390/430px was attempted, but the in-app browser timed out against localhost. Production build completed with one style-budget warning: the feature stylesheet is 8.85 kB versus the 6 kB warning threshold, below the 10 kB error threshold. |
| 2026-10-17 | Wi-Fi mobile test endpoint | Passed locally: Wi-Fi already uses static `192.168.5.251/24`; Angular listens on `0.0.0.0:91`; `/`, proxied `/api/v1`, proxied Swagger and backend readiness returned HTTP 200 through `http://192.168.5.251:91`. Added `/hubs` WebSocket proxy. Windows already has an enabled inbound Node.js allow rule for the active Public profile; creating a narrower named TCP 91 rule was denied because the shell was not elevated as Administrator. |
| 2026-10-17 | HTTP LAN UUID compatibility | Passed: replaced direct `crypto.randomUUID()` calls in Stranger Chat, group Chat and Werewolf with shared RFC 4122 v4 generation based on `crypto.getRandomValues()`. Frontend lint passed, Vitest passed 11/11, production build completed, direct-use scan returned zero and the restarted Wi-Fi frontend/API both returned HTTP 200. |
| 2026-10-17 | Stranger Chat gender-preference backend checks | Passed: serialized API and integration-project builds completed with 0 warnings/errors; UnitTests passed 26/26 and ArchitectureTests passed 4/4. The first sandboxed unit-test attempt timed out waiting for `testhost`; rerunning outside the sandbox passed. |
| 2026-10-17 | Stranger Chat gender-preference PostgreSQL checks | Passed: `AddGuestGenderPreferences` applied to the local PostgreSQL 18 database, and EF reports no pending model changes. Focused Testcontainers integration tests passed 2/2, covering rejected enum values and mutual preference matching. The shared factory now gives its Testcontainer connection setting host-level precedence over Development configuration. |
| 2026-10-17 | Stranger Chat gender-preference frontend checks | Passed: Prettier lint, Angular production build and Vitest 12/12. In-app browser QA at 390×844 visibly showed all three own-gender choices and all four preference choices with no horizontal overflow (`scrollWidth` 376 versus viewport 391). Production build reports the existing feature stylesheet warning at 9.93 kB against the 6 kB warning threshold, still below the 10 kB error threshold. Physical-device and 360/430px acceptance remain pending. |
| 2026-10-17 | Backend format verification for gender-preference increment | Passed when scoped to every backend file changed by this increment. Full-solution `dotnet format --verify-no-changes` still reports pre-existing whitespace/encoding/import-order drift elsewhere; broad unrelated reformatting was intentionally not applied. |
| 2026-10-18 | Security hardening locked restore/build | Passed after regenerating previously stale package lock entries with `--force-evaluate`: locked restore succeeded and serialized build of all 39 projects completed with 0 warnings and 0 errors. |
| 2026-10-18 | Security dependency advisory scan | Passed: `dotnet list backend/Campfire.slnx package --vulnerable --include-transitive` reported no vulnerable NuGet packages for any project; `npm audit --omit=dev` reported 0 vulnerabilities. Both queried their live registries. |
| 2026-10-18 | Security source review | Passed for audited paths: all HTTP mutations retain antiforgery filters; Identity/group/event/game routes enforce server-side authorization; Chat/Werewolf hubs require Identity auth; Stranger hub now dispatches via `ISender` and revalidates the guest credential/conversation. No unsafe Angular HTML rendering, auth/guest storage, sensitive body/token/role logging or internal guest-session ID response remained. Theme is the only non-test `localStorage` use. |
| 2026-10-18 | Production fail-closed smoke | Passed: starting without explicit production `AllowedHosts` terminated before listening with exit code 1. Code also requires HTTPS and persistent Data Protection keys; OpenAPI/Swagger mapping is inside the Development-only branch. |
| 2026-10-18 | Security backend checks | Passed: targeted `dotnet format --verify-no-changes`, full backend build, UnitTests 26/26 and ArchitectureTests 4/4. EF reported no pending Stranger Chat model changes after `EnsureSingleReportPerConversation`. |
| 2026-10-18 | Security frontend checks | Passed: Prettier lint, Vitest 12/12 and Angular production build. The existing Stranger Chat stylesheet warning remains 9.93 kB against the 6 kB warning threshold and below the 10 kB error threshold. |
| 2026-10-18 | Security PostgreSQL integration | Failed before assertions: four focused `StrangerChatApiTests` could not construct their Testcontainers fixture because Docker endpoint `npipe://./pipe/docker_engine` was unavailable. Docker Desktop service was confirmed `STOPPED`; this session could not start `com.docker.service` because Administrator access was denied. Regression cases for antiforgery/headers/session-ID secrecy and report termination/idempotency compile but are not marked passed. |
| 2026-10-18 | M11 frontend lint/tests/build | Passed: Prettier source lint, Vitest 12/12 and Angular production build. Shell coverage was updated for the accessible text labels behind the new SVG navigation icons. The pre-existing Stranger Chat stylesheet warning remains 9.94 kB, below the 10 kB error budget. |
| 2026-10-18 | M11 responsive browser QA | Not run to visual acceptance: `ng serve` built and listened on `http://127.0.0.1:4200`, but the only available in-app browser returned `ERR_CONNECTION_TIMED_OUT`; no Chrome/Edge automation surface was available. Responsive source targets narrow/mobile and desktop rail breakpoints, but this is not recorded as visual evidence. |
| 2026-10-18 | M12 Chat backend checks | Passed: targeted .NET format, full 39-project Release build with 0 warnings/errors, UnitTests 27/27 and ArchitectureTests 4/4. Domain coverage accepts only allow-listed stickers and retains plain text semantics. |
| 2026-10-18 | M12 Chat migration/model | Passed: `20261018135844_AddChatMessageKinds` adds non-null `Kind` with `Text` default and `CK_Messages_Kind`; EF reported no pending model changes. The focused PostgreSQL 18 Testcontainers test passed 1/1 from a blank database after refreshing the authenticated XSRF token in test setup; assertions cover text/sticker persistence, identical retry, changed-kind 409, unknown sticker 400 and row count. |
| 2026-10-18 | M12 Chat frontend | Passed: Prettier lint, Vitest 13/13 and Angular production build. Typed REST tests cover both `Text` and `Sticker` payloads. Physical 360/390/430px/desktop visual acceptance was not run because the available browser cannot reach localhost. |
| 2026-10-21 | Production-readiness verdict | **Not ready to deploy.** A clean backend restore with `--locked-mode` failed `NU1004` across the projects whose package/project references no longer match `packages.lock.json`; the serialized Release build consequently failed with 23 errors. The checked-in CI command uses the same locked restore and would fail before tests. No source is committed on the current `master` branch and no Git remote is configured, so there is no immutable revision for CI/release provenance. |
| 2026-10-21 | Production artifact/operations audit | `infra/compose.yml` parses successfully, but it contains only PostgreSQL and LiveKit. The repository has no API/frontend Dockerfile, static-edge/reverse-proxy configuration, deployment manifest/IaC, CI deploy job, automated browser/E2E suite, or executable backup/restore automation. Docker Desktop's Linux engine was unavailable during this audit, so the complete PostgreSQL integration suite, blank-database migrator run, readiness smoke, and LiveKit runtime smoke were not rerun. |
| 2026-10-21 | Production security audit | Passed source checks for same-origin HttpOnly auth/guest cookies, antiforgery on HTTP mutations, resource-scoped REST/SignalR authorization, Development-only Swagger, defensive/no-store API headers, private PostgreSQL binding, and production fail-closed validation. Runtime probes confirmed Production exits when `AllowedHosts` is wildcard/missing and when persistent `DataProtection:KeysPath` is missing. No auth/guest token storage, unsafe Angular HTML rendering, or sensitive application logging was found. Public launch remains blocked by missing email verification/recovery, a real Stranger Chat feature rollout gate and staffed moderation/support/privacy operations. |
| 2026-10-21 | Frontend clean install and quality gates | `npm ci` passed with the pinned Node 24.18.0/npm 11.16.0 toolchain. Prettier lint passed, Vitest passed 13/13 and the Angular production build passed (initial 299.03 kB) with the existing Stranger Chat stylesheet warning at 9.94 kB versus the 6 kB warning budget. `npm audit --omit=dev` reported 0 production vulnerabilities; the full development tree reported one moderate and one high advisory through Vite 8.3.2 in `@angular/build`. |
| 2026-10-21 | Backend residual evidence | A live NuGet advisory query reported no known vulnerable packages. Direct execution of the previously built Release test DLLs passed UnitTests 27/27 and ArchitectureTests 4/4, but this is not a substitute for a clean current-source build because those binaries predate this audit. Full-solution format, current-source tests, EF model-drift checks and integration tests are therefore not marked passed for this audit. |
| 2026-10-21 | Docker API LAN runtime | Passed: regenerated NuGet locks pass `restore --locked-mode`; the full 39-project Release build passed with 0 warnings/errors; UnitTests passed 27/27 and ArchitectureTests passed 4/4. The pinned-digest .NET Dockerfile published API and migrator; PostgreSQL 18 became healthy; the one-shot migrator exited 0 after applying Identity, Groups, Chat, Events, Werewolf and Stranger Chat; API liveness, readiness, `/api/v1` and Development Swagger all returned HTTP 200 through `http://192.168.5.185:92`. The container mapping is exactly `192.168.5.185:92 -> 8080`. Creating the optional Windows Private-profile TCP 92 firewall rule failed with `Access is denied`, so phone access still requires the user to run that command from an Administrator terminal. |
# AWS container packaging verification — 2026-10-22

- Passed: `docker compose --env-file .env.ec2.example -f compose.ec2.yml config --quiet` with `CAMPFIRE_ENV_FILE=.env.ec2.example`.
- Passed: frontend `npm run lint`.
- Passed: frontend `npm test` — 9 files, 13 tests.
- Passed: frontend `npm run build`; the existing Stranger Chat stylesheet warning remains 9.94 kB against the 6 kB warning threshold and below the 10 kB error threshold.
- Passed: `git diff --check`.
- Not run: local frontend Docker image build because the Docker Desktop Linux engine pipe was unavailable. Compose syntax was validated, but the complete EC2 image/TLS/runtime flow remains to be exercised on the target EC2 host.

# Complete chat interactions — 2026-10-24

- Passed: API project build and integration-test project build with .NET SDK 10.0.112, 0 warnings/errors.
- Passed: generated and inspected `CompleteChatInteractions` migrations for both `chat` and `stranger_chat`; each keeps schema ownership, self-reply FK, reaction composite key, indexes and allowlist checks.
- Passed: Angular production build; Chat is below its component-style warning budget. The pre-existing Stranger Chat warning remains at 9.94 kB, below the 10 kB error threshold, after moving new interaction rules to scoped global styles.
- Passed: frontend Vitest 16/16. Service tests cover reply/sticker payloads and protected reaction endpoints.
- Passed: source security review found no unsafe HTML/browser credential storage or message/token logging. Group membership and active Stranger participant checks protect reactions; reply targets are constrained to the same resource; XSRF and existing rate limits protect mutations.
- Passed outside the restricted named-pipe sandbox: all backend unit tests 30/30, including 10 focused Chat/Stranger Chat domain tests; architecture tests 4/4.
- Blocked: PostgreSQL integration assertions compiled successfully but were not run because Docker Desktop's Linux engine pipe was unavailable in this verification pass.
- Existing repository formatting debt remains: solution-wide `dotnet format --verify-no-changes` reports the previously compact Stranger Chat source layout plus generated-migration encoding/line-ending differences. It did not mutate files; API and integration projects still build with 0 warnings/errors. Frontend Prettier lint passes.
- Pending: physical browser QA at 360/390/430 px and desktop for auto-scroll, mobile keyboard, Enter/Shift+Enter, reaction wrapping and reply/sticker rendering.

# Production dark-mode hardening — 2026-10-25

- Passed: optimized production CSS contains the `:root[data-theme=dark]` selector, ruling out theme-token removal during Angular optimization.
- Passed: focused `ThemeService` Vitest 3/3, including DOM toggling and a production-like `SecurityError` from blocked browser storage.
- Passed: Angular production build. The existing Stranger Chat stylesheet warning remains 9.94 kB against the 6 kB warning threshold and below the 10 kB error threshold.
- Passed: full frontend Prettier lint and full Vitest suite 18/18.
- Pending: physical verification on the deployed origin after rebuilding/replacing the web container.

# Production sticker layout repair — 2026-10-25

- Passed: frontend Prettier lint and Angular production build.
- Passed assertions: full Vitest output reported 9 files and 18/18 tests passed. The Angular test command retained an open handle after printing the completed result in two runs and was stopped manually, so a clean process exit is not claimed.
- Source review: Group Chat no longer renders the accessible sticker label as a child text node inheriting the 3.4–5.2rem sticker font; both chat variants use container `aria-label`, and the Group Chat sticker is bounded to 128px with overflow clipping.
- Pending: physical verification on the deployed origin after rebuilding the frontend image; browser visual automation was not available in this pass.

# Production domain alignment — 2026-10-25

- Live pre-deploy smoke passed: `https://tamsuvoinhau.cloud/stranger` returned HTTP 200 and `https://tamsuvoinhau.cloud/api/v1` returned the Campfire API v1 payload.
- Live header inspection found the currently deployed legacy override: CSP still permits `http:`/`ws:` and the response omits HSTS. This is expected to be replaced by the checked-in HTTPS-only Nginx/Caddy configuration; do not include `compose.ip.yml` in the rebuild.
- Passed: `docker compose config --quiet` using the checked-in EC2 example environment.
- Passed rendered-config inspection: `ASPNETCORE_ENVIRONMENT=Production`, `AllowedHosts=tamsuvoinhau.cloud`, `LiveKit__PublicUrl=wss://tamsuvoinhau.cloud/livekit`, and the API healthcheck sends `Host: tamsuvoinhau.cloud`.
- Passed: `git diff --check` reported no whitespace errors; line-ending conversion notices are pre-existing workspace behavior.
- Source security review passed for same-origin relative frontend API/hub URLs, HTTPS-required cookies, trusted-proxy forwarded scheme and explicit production host filtering. The old `compose.ip.yml` Development/HTTP override must not be included in the domain deployment.
- Blocked locally: Nginx container syntax/runtime validation was not run because the Docker Desktop Linux engine is unavailable. Compose parsing passed; the target EC2 rebuild and HTTPS/SignalR smoke tests remain required.

# Unified mobile chat actions and theme fallback — 2026-10-25

- Passed: Angular production build. Group Chat and Stranger Chat compile with the shared long-press/action-toolbar component; the existing Stranger Chat component stylesheet remains below its 10 kB error budget at 9.96 kB.
- Passed: frontend Prettier lint and Vitest 21/21 across 10 files. New focused tests prove the compact trigger opens the toolbar, reaction selection closes it and the reply action is icon-only with an accessible label. Theme tests prove both the DOM attribute and fallback root classes switch correctly.
- Passed source review: each chat binds the same action component, long-press directive and bounded scroll viewport. New-message reconciliation calls the viewport scroll only after Angular has rendered the updated list (two animation frames).
- Passed: `git diff --check` found no whitespace errors; only the repository's existing LF-to-CRLF notices were reported.
- Blocked visual acceptance: the Angular development server built and listened on `127.0.0.1:4200`, but the available in-app browser returned `ERR_CONNECTION_TIMED_OUT`, and no Chrome automation provider was available. Physical-device acceptance at 360/390/430px and deployed-origin dark-mode verification remain pending.

# Learning base and Stranger Chat composer polish — 2026-10-26

- Passed: force-evaluated NuGet locks, then full 39-project backend build with 0 warnings/errors. The Learning module projects, host composition, migrator and tests compile.
- Passed: frontend Prettier lint, Vitest 23/23 and Angular production build. The Learning lazy chunk is emitted; Stranger Chat picker styles stay below the updated 16kB component-style error budget.
- Passed: EF query review fixed exercise-answer sanitization to run after materialization, avoiding a non-translatable custom method inside an EF projection.
- Passed: `git diff --check` after the UI and Learning changes.
- Not run: PostgreSQL migration/runtime integration and browser visual QA. Docker Desktop's Linux engine was unavailable in this environment, and physical 360–430px/deployed-origin testing still requires the target device/browser.
- Scope limitation: the seeded course currently contains the HSK 1 base structure plus Day 1/Day 2 content. TTS, microphone/pronunciation scoring, conversation AI and AI vocabulary expansion remain explicitly unavailable until a provider and privacy/retention policy are configured; no UI action reports fake success.

# Production dark-mode diagnosis and hardening — 2026-10-26

- Source diagnosis: the optimized stylesheet contains both `:root[data-theme='dark']` and `.theme-dark`; ThemeService already toggled the DOM and persisted safely. Therefore a production-only failure is most likely stale SPA shell/container cache or a deployment serving an older frontend image, not Sass selector removal.
- Changed: ThemeService now also sets `document.documentElement.style.colorScheme`, body fallback classes and the `theme-color` meta tag. Nginx now sends `Cache-Control: no-cache, no-store, must-revalidate` for the SPA shell while retaining long-lived caching only for hashed static assets.
- Changed: the global token stylesheet now applies the dark/light palettes through both the root selector and `body.theme-dark`/`body.theme-light`, so production style scoping cannot leave the body on light tokens after the DOM state changes.
- Passed: frontend Prettier lint, Vitest 23/23 and Angular production build after the hardening.
- Required deployment verification: rebuild/restart the web container, confirm the response HTML is fresh, hard-refresh/clear site data once, then toggle and inspect `html[data-theme="dark"]`, `html.theme-dark`, `body.theme-dark` and computed `--background` in DevTools. If the DOM changes but computed variables do not, the deployed CSS is stale or from an old image.

# Learning navigation visibility — 2026-10-26

- Source check: the authenticated shell contains the `/learning` navigation item and the route is lazy-loaded behind the authentication guard. The item is intentionally hidden for guests.
- Passed after restoring the auth condition: frontend lint, Vitest 23/23 and Angular production build. The emitted production output includes the `learning-page` lazy chunk.
- Diagnosis for the supplied screenshot: it is serving an older frontend artifact/image; the current source cannot produce an authenticated five-item shell without the `/learning` link.

# Unified professional chat UX — 2026-10-28

- Passed: frontend Prettier lint.
- Passed: Vitest 23/23 across 11 test files.
- Passed: Angular production build; Group Chat and Stranger Chat are emitted as lazy chunks and all component styles remain inside the configured warning/error budgets.
- Passed: `git diff --check`; only the repository's existing LF-to-CRLF conversion notices were emitted.
- Source review passed for keyboard behavior, accessible icon labels, long-press/context-menu handling, bounded mobile viewports, history-position preservation and near-bottom/unread message reconciliation.
- Not run: physical visual/keyboard acceptance at 360/390/430 px and deployed-origin testing. Rebuild the frontend container before evaluating these changes on `tamsuvoinhau.cloud`.

# NuGet locked-restore CI repair — 2026-10-28

- Root cause: the committed lock graph did not include the direct FluentValidation/MediatR dependencies and EF Core dependencies introduced by the Learning module restructure. GitHub Actions correctly failed `dotnet restore backend/Campfire.slnx --locked-mode` with NU1004 before build.
- Changed: regenerated the solution's `packages.lock.json` files with `--force-evaluate`; CI remains strict and no workflow security/quality gate was disabled.
- Passed: exact solution `dotnet restore backend/Campfire.slnx --locked-mode --disable-parallel` using the regenerated lock graph.
- Passed: Release solution build with 0 warnings and 0 errors.
- Passed: UnitTests 32/32 and ArchitectureTests 4/4.
- Environment note: the workstation has SDK 10.0.402 while CI pins 10.0.112. Lock generation/verification temporarily selected the installed SDK, then `global.json` was restored unchanged to 10.0.112; centrally pinned NuGet versions and resulting hashes are committed in the lock files.

