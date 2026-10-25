# Campfire — Prompt dựng dự án từ repository trống

Ngày soạn: 15/10/2026. Chủ dự án: backend .NET, frontend Angular, PostgreSQL, triển khai AWS.

## 1. Cách sử dụng

1. Tạo một thư mục/repository trống tên `campfire`, mở bằng Codex tại máy phát triển.
2. Đặt tệp này tại thư mục gốc. Đây là tài liệu đầu vào, chưa phải source ứng dụng.
3. Gửi cho Codex đoạn khởi động bên dưới. Codex phải đọc toàn bộ tài liệu rồi tạo file thật, cài dependency, chạy kiểm tra; không chỉ trả về code trong chat.
4. Codex tạo `AGENTS.md` theo mục 19, các instructions theo phạm vi và các skill theo mục 17 trước khi triển khai nghiệp vụ.
5. Theo dõi `docs/implementation-plan.md`, `docs/progress.md` và `docs/verification.md`. Nếu phiên làm việc bị ngắt, dùng đoạn tiếp tục ở cuối tệp.

### Đoạn khởi động để dán vào Codex

```text
Đọc toàn bộ Campfire-Codex-Bootstrap.md trong repository hiện tại và thực thi các yêu cầu trong đó.
Hãy dựng source thật từ thư mục trống: backend .NET modular monolith, Clean Architecture trong từng module, PostgreSQL và Angular stable mới nhất, mobile-first.
Trước tiên kiểm tra môi trường, lập kế hoạch vào docs/implementation-plan.md, tạo AGENTS.md và instructions theo phạm vi, rồi thực hiện tuần tự các milestone M0–M7. Tiếp tục các bước local đã được yêu cầu mà không dừng chỉ để xin xác nhận kế hoạch.
Tạo nền tảng cùng MVP hoạt động thật gồm Identity, Groups, Chat và Events; Funds, Plans, Werewolf và Voice chỉ có roadmap, chưa triển khai.
Cài/cấu hình skill và công cụ theo mục 17 trong môi trường Codex này; xác minh nguồn, phiên bản, license và khả năng tương thích. Skill tùy chọn bị chặn không được chặn việc dựng ứng dụng.
Không dồn code vào Program.cs hay một file lớn. Không dùng mock thay API thật trong sản phẩm hoàn thiện. Không tuyên bố production-ready hoặc tests passed nếu chưa có bằng chứng.
Đọc mục 18 để biết tiêu chí nghiệm thu, mục 19 để tạo AGENTS.md. Kết thúc bằng cách chạy local, tài khoản demo nếu có, kết quả kiểm tra, hạn chế còn lại và các bước tiếp theo.
Không provision AWS, không phát sinh tài nguyên trả phí, không publish repo hoặc push remote trong nhiệm vụ dựng base này.
```

## 2. Vai trò và kết quả cần đạt

Bạn là kỹ sư triển khai Campfire. Hãy xây nền tảng có thể bảo trì và mở rộng, với độ phức tạp phù hợp cho một developer vận hành. Không hiểu “dành cho hệ thống lớn” là phải thêm mọi thư viện hay mọi pattern.

Kết quả cần có:
- Repository có backend, frontend, PostgreSQL migrations, Docker Compose, CI và tài liệu.
- Bốn module MVP hoạt động xuyên suốt từ UI tới PostgreSQL: Identity, Groups, Chat, Events.
- Ranh giới module được kiểm tra tự động, logging/validation/authorization nhất quán.
- Chạy được bằng Docker Compose; đồng thời có hướng dẫn chạy backend/frontend trực tiếp để debug.
- Giao diện tiếng Việt, dùng thuận tiện trên điện thoại; tên code và API bằng tiếng Anh.
- Một backend triển khai chung, một Angular SPA; không xây microservices trong giai đoạn này.

## 3. Sản phẩm và phạm vi

Campfire là không gian riêng của các nhóm bạn thân: trò chuyện, lên kèo, đóng quỹ, lập kế hoạch và chơi Ma Sói. Mô hình dữ liệu hỗ trợ nhiều nhóm dù ban đầu chỉ một hội bạn sử dụng.

### MVP cần triển khai

**Identity**
- Đăng ký email/mật khẩu/display name, đăng nhập, đăng xuất, lấy thông tin tài khoản hiện tại.
- Đổi mật khẩu có kiểm tra mật khẩu hiện tại; đăng xuất và vô hiệu session đúng cách.
- Dùng ASP.NET Core Identity cho hash mật khẩu, normalization, lockout và security stamp.
- Không cho đặt quyền quản trị qua payload đăng ký.
- Chưa xây gửi email/reset mật khẩu nếu chưa có provider; ghi rõ giới hạn trước khi mở đăng ký rộng rãi. Không dựng nút gửi email giả.

**Groups**
- Tạo nhóm riêng, đổi tên nhóm, liệt kê nhóm của tôi, xem thành viên.
- Vai trò Owner và Member; đúng một owner ở MVP.
- Owner tạo link mời có thời hạn, thu hồi link. Token ngẫu nhiên đủ mạnh, chỉ lưu hash; raw token chỉ trả lúc tạo.
- Người đã đăng nhập dùng link để vào nhóm; join lặp không tạo membership trùng.
- Chủ nhóm có thể xóa thành viên; member có thể rời nhóm. Owner phải chuyển quyền cho thành viên khác trước khi rời.
- Việc chuyển owner là transaction, kiểm tra concurrent update. Không làm xóa nhóm trong MVP.
- Liên kết mời không bị sử dụng bằng GET; mở link chỉ hiển thị xác nhận, POST mới tham gia.

**Chat**
- Một hội thoại chung cho mỗi nhóm, chỉ nhắn văn bản ở MVP.
- Nội dung tối đa 2.000 ký tự, không nhận chuỗi chỉ có khoảng trắng; hiển thị như plain text.
- Gửi qua REST để có semantics lỗi/idempotency rõ ràng; SignalR dùng subscription và nhận thông báo realtime.
- Lưu tin thành công trước khi phát realtime. UI optimistic có trạng thái pending/sent/failed và retry cùng clientMessageId.
- Phân trang bằng cursor ổn định theo thời gian + ID; giới hạn tối đa 100 tin/lần, mặc định 30–50.
- Kết nối lại tải phần lịch sử còn thiếu, khử trùng theo messageId; không hứa exactly-once delivery.
- Không cần typing indicator, read receipt, edit/delete, ảnh, voice hoặc full-text search ở MVP.

**Events — lên kèo**
- Tạo kèo: tiêu đề, mô tả, thời điểm diễn ra, địa điểm text; chưa có bình chọn nhiều giờ/địa điểm.
- Danh sách kèo theo nhóm, chi tiết kèo, danh sách tham gia.
- RSVP: Going / NotGoing; chưa trả lời thể hiện riêng, không tự coi là NotGoing.
- Trạng thái: Open / Confirmed / Cancelled. Creator hoặc owner nhóm được sửa/chốt/hủy; chỉ cho các chuyển trạng thái đã định nghĩa.
- Chỉ Open nhận thay đổi RSVP; Confirmed và Cancelled khóa RSVP ở MVP. Viết rõ quy tắc này trên UI.
- Chỉ thời gian tương lai khi tạo/chỉnh thời gian; dùng clock injectable cho kiểm thử.
- Thành viên rời nhóm không còn quyền truy cập kèo. RSVP cũ giữ lại như lịch sử và UI đánh dấu không còn trong nhóm.
- Có concurrency token khi sửa/chốt/hủy; API conflict trả 409, UI mời tải lại.
- Chưa tự động đăng tin hệ thống khi tạo kèo; chưa cần tích hợp liên module bằng event broker.

### Chỉ ghi roadmap, không xây code rỗng hàng loạt

- Funds: mức đóng, người giữ quỹ xác nhận đã nhận tiền, thu–chi, quyết toán; không giữ tiền người dùng, không tích hợp ngân hàng ở MVP.
- Plans: template, checklist, phân công, lịch trình; chưa cần AI.
- Werewolf: state machine, server-authoritative, vai bí mật, reconnect; không lộ vai trong API/log.
- Voice: WebRTC/SFU riêng, quyền nói/nghe theo pha; không truyền audio qua SignalR, không ghi âm mặc định.
- Không tạo project/DbContext/service cho các module tương lai chỉ để chúng tồn tại.

## 4. Kiểm tra môi trường và chọn phiên bản

Trước khi scaffold, kiểm tra git status, nội dung thư mục, OS, dotnet SDK, Node/npm, Docker/Compose và port đang sử dụng. Không ghi đè file của người dùng.

- Backend: .NET 10 LTS, bản servicing stable phù hợp, `net10.0`; kiểm tra lại support policy tại thời điểm thực thi. Không chọn preview chỉ vì số phiên bản cao hơn.
- EF Core và Npgsql EF provider phải tương thích major version, xác minh package chính thức trước khi restore.
- Frontend: Angular bản stable mới nhất tại ngày chạy, không next/rc. Tham chiếu lúc soạn: Angular 22 đang active; Codex phải xác minh version thực tế, không đoán số patch.
- Chọn Node LTS còn được hỗ trợ, thỏa bảng Angular compatibility. TypeScript/RxJS theo Angular CLI, không tự nâng vượt range.
- PostgreSQL: chọn một major stable còn được hỗ trợ, kiểm tra Npgsql/Testcontainers phù hợp rồi pin image version; không dùng tag `latest`.
- Đọc các tài liệu chính thức Angular, .NET, Npgsql, PostgreSQL khi cần quyết định API; không tái sử dụng snippet cũ một cách máy móc.
- Pin SDK trong `global.json`, Node trong `.nvmrc` hoặc `.node-version`, package manager trong `package.json`; commit npm lock và NuGet lock. Restore locked mode trong CI.
- Dùng central package management `Directory.Packages.props`; bật nullable, analyzers và build warnings policy phù hợp.
- Tạo `docs/toolchain.md` ghi phiên bản chính xác, ngày xác minh, URL nguồn và compatibility matrix. Nếu không có mạng, ghi unavailable/unverified; không tự tuyên bố đã xác minh latest.
- Khi SDK/tool bắt buộc thiếu: cài local trong phạm vi đã được phép nếu khả thi; không thay đổi policy/quyền hệ thống. Báo blocker cụ thể và tiếp tục phần độc lập.

## 5. Cấu trúc monorepo và project

Đây là sơ đồ thư mục, không phải một file gom tất cả class. Mỗi thư mục project phải có `.csproj` thật nếu được chỉ định.

```text
campfire/
  AGENTS.md
  README.md
  .editorconfig
  .gitignore
  .env.example
  global.json
  Directory.Build.props
  Directory.Packages.props
  .agents/skills/
  .github/workflows/ci.yml
  docs/
    implementation-plan.md
    progress.md
    verification.md
    toolchain.md
    architecture.md
    database.md
    api.md
    realtime.md
    design-system.md
    skills-manifest.md
    security.md
    operations.md
    roadmap.md
    adr/
  backend/
    AGENTS.md
    Campfire.slnx                 # hoặc .sln nếu toolchain yêu cầu
    src/
      Host/Campfire.Api/
        Program.cs
        Composition/
        Middleware/
        Configuration/
      BuildingBlocks/
        Campfire.BuildingBlocks.Domain/
        Campfire.BuildingBlocks.Application/
        Campfire.BuildingBlocks.Infrastructure/
        Campfire.BuildingBlocks.Presentation/
      Modules/
        Identity/
          Campfire.Modules.Identity.Domain/
          Campfire.Modules.Identity.Application/
          Campfire.Modules.Identity.Infrastructure/
          Campfire.Modules.Identity.Presentation/
          Campfire.Modules.Identity.Contracts/
        Groups/
          Campfire.Modules.Groups.Domain/
          Campfire.Modules.Groups.Application/
          Campfire.Modules.Groups.Infrastructure/
          Campfire.Modules.Groups.Presentation/
          Campfire.Modules.Groups.Contracts/
        Chat/
          Campfire.Modules.Chat.Domain/
          Campfire.Modules.Chat.Application/
          Campfire.Modules.Chat.Infrastructure/
          Campfire.Modules.Chat.Presentation/
          Campfire.Modules.Chat.Contracts/
        Events/
          Campfire.Modules.Events.Domain/
          Campfire.Modules.Events.Application/
          Campfire.Modules.Events.Infrastructure/
          Campfire.Modules.Events.Presentation/
          Campfire.Modules.Events.Contracts/
    tests/
      Campfire.ArchitectureTests/
      Campfire.UnitTests/
      Campfire.IntegrationTests/
    tools/Campfire.DbMigrator/
  frontend/
    AGENTS.md
    angular.json
    package.json
    package-lock.json
    src/app/
      core/
      shared/ui/
      layout/
      features/auth/
      features/groups/
      features/chat/
      features/events/
    src/styles/
    e2e/
  infra/
    compose.yaml
    docker/
    nginx/
    aws/README.md
  scripts/
```

BuildingBlocks phải rất nhỏ, chỉ chứa thành phần thực sự dùng chung như clock abstraction, result/error, request validation plumbing, exception mapping. Không biến nó thành kho chứa business entity, DbContext chung hoặc generic repository framework.

Mỗi feature có folder riêng bên trong Application. Ví dụ:

```text
Groups.Application/Features/CreateGroup/
  CreateGroupCommand.cs
  CreateGroupHandler.cs
  CreateGroupValidator.cs
  CreateGroupResponse.cs
Groups.Domain/Groups/
  Group.cs
  GroupMember.cs
  GroupRole.cs
Groups.Infrastructure/Persistence/
  GroupsDbContext.cs
  Configurations/GroupConfiguration.cs
  Configurations/GroupMemberConfiguration.cs
  Migrations/
Groups.Presentation/Endpoints/
  CreateGroupEndpoint.cs
  GetMyGroupsEndpoint.cs
Groups.Contracts/
  IGroupMembershipService.cs
  GroupMembershipDto.cs
```

Một top-level type/file; partial và generated code có ngoại lệ rõ ràng. Không đặt entity, validator, handler, endpoint vào cùng một file. `Program.cs` chỉ compose bootstrap, không chứa business logic. DTO theo feature; contract liên module ở Contracts, không biến Contracts thành nơi gom mọi API DTO.

## 6. Dependency rules và Clean Architecture

- Domain: không EF Core, ASP.NET, Identity framework, HTTP, logging provider hoặc service cloud. Identity framework model nằm ở Infrastructure, không kéo framework vào Domain chỉ để đủ số lớp.
- Application: phụ thuộc Domain và abstraction cần thiết; không phụ thuộc Infrastructure/Presentation/Host. Được dùng Contracts của module khác với reference có chủ đích.
- Infrastructure: implement abstraction Application, persistence, Identity framework, adapters.
- Presentation: endpoints/hub mỏng, gọi use case; không truy cập DbContext trực tiếp.
- Contracts: data/contract công khai tối thiểu, không tham chiếu implementation của module; tránh dependency cycle.
- Host được reference composition entry points của Infrastructure/Presentation để đăng ký DI, không chứa nghiệp vụ.
- Module không reference Domain/Application/Infrastructure/Presentation của module khác. Chỉ reference Contracts khi cần.
- Ví dụ Events và Chat dùng `Groups.Contracts.IGroupMembershipService` để kiểm tra membership/quyền; implementation ở Groups.
- Không gọi HTTP tới chính backend để liên module. Không join SQL xuyên schema trong repository của module khác.
- Không share entity EF, navigation property xuyên module hoặc foreign key xuyên schema module. Lưu ID tham chiếu và xác minh qua contract; FK nội module vẫn dùng bình thường.
- Dùng module composition rõ ràng, tránh assembly scanning ma thuật cho toàn bộ ứng dụng. Không mở `InternalsVisibleTo` hàng loạt để né ranh giới.
- Architecture tests kiểm tra reference graph, dependency direction và prohibited namespaces ở code; không chỉ kiểm tra tên folder.
- Clean Architecture không bắt buộc mediator library. Mặc định dùng use-case interfaces/handlers + validator decorator rõ ràng; nếu chọn mediator, xác minh license/version và ghi ADR, không tự viết mediator framework lớn.
- Không thêm generic repository chỉ bọc lại toàn bộ EF Core. Dùng interface persistence/use-case phù hợp, transaction owner rõ ràng và kiểm thử được.

## 7. PostgreSQL, migration và tính nhất quán

- Một database, schema riêng: `identity`, `groups`, `chat`, `events`.
- Mỗi module một DbContext và migration history table nằm đúng schema; mỗi DbContext là owner duy nhất của dữ liệu module đó.
- `Campfire.DbMigrator` là tool chạy tuần tự migration cho các module, exit non-zero khi lỗi. Có tài liệu add migration theo module, generate SQL và review trước production.
- Không dùng EnsureCreated cho database ứng dụng có migrations. Không tự động migrate khi mỗi API instance khởi động production.
- Seed demo idempotent, chỉ Development/Test, opt-in; mật khẩu lấy từ secret local/env, không hardcode credential thật hoặc seed trong production.
- ID kiểu UUID, `timestamptz` cho thời điểm tuyệt đối; lưu UTC. UI dùng timezone người dùng; tránh parse nhầm datetime-local thành UTC, kiểm thử chuyển đổi Asia/Ho_Chi_Minh.
- Pagination bounded; query read-only dùng projection và AsNoTracking khi phù hợp. Kiểm tra N+1 bằng integration test hoặc query inspection.
- Unique constraints tối thiểu: normalized email, group/user membership, event/user RSVP, chat group/sender/clientMessageId, invite token hash.
- Index theo truy vấn thật: group memberships theo user; chat theo group/time/id; events theo group/startTime/id. Ghi lý do index trong database.md.
- Concurrency token dùng cơ chế PostgreSQL/Npgsql được hỗ trợ hoặc application-managed token; không dùng SQL Server rowversion một cách máy móc.
- Transaction cho tạo nhóm + owner; transfer owner; RSVP update/upsert phù hợp; chat persist + idempotency.
- Mapping unique/concurrency lỗi có chủ đích sang 409 hoặc kết quả idempotent, không biến mọi database exception thành 400.
- Nếu dùng EF execution strategy retry, transaction phải nằm trong execution strategy và không phát side effect trước commit.
- Không mở database public trong cấu hình production. Local port chỉ bind loopback nếu cần debug.
- Chưa tạo ledger/quỹ trong MVP; ghi nguyên tắc tiền decimal + currency, rounding và audit vào roadmap để tránh float khi bổ sung.

## 8. API, validation và error handling

- API prefix `/api/v1`; OpenAPI cho endpoint public của MVP, mô tả auth/validation/pagination/error.
- Routes nhất quán, DTO request/response riêng, không trả EF entity.
- Các nhóm endpoint cần có: auth, groups, memberships/invites, group messages, group events, event RSVP và transition trạng thái. Liệt kê chính xác routes/status code trong docs/api.md và dùng làm hợp đồng frontend.
- Input validation ở Application bằng FluentValidation phiên bản stable tương thích, gọi async validators đúng cách. Không chỉ validate tại controller hoặc Angular.
- Domain tự bảo vệ invariants kể cả khi bỏ qua HTTP. Database constraints là lớp cuối cho race condition.
- Exception handler tập trung, trả ProblemDetails có `code`, `traceId`, và field errors khi validation; tuyệt đối không leak stack/SQL/connection string ra client production.
- Status: 400 malformed/validation, 401 chưa đăng nhập, 403 thiếu quyền trong phạm vi được phép biết, 404 không tồn tại/ẩn tài nguyên nhóm khác, 409 conflict, 429 rate limit, 500 lỗi ngoài dự kiến.
- Expected business errors dùng Result/Error có kiểu rõ ràng; exception chỉ cho tình huống bất thường. Không catch rồi trả success.
- Pass CancellationToken xuyên HTTP → use case → database. Client hủy không log như lỗi hệ thống nghiêm trọng.
- Options binding + ValidateOnStart; config thiếu phải fail rõ ràng và không in secret.
- Request size limit, text length limit và rate limit đăng nhập/chat/invite. API policy và hub policy phải nhất quán; chỉ thêm rate limiter ở REST không bảo vệ hub methods.
- Dùng System.Text.Json; không thêm Newtonsoft nếu không có nhu cầu cụ thể.
- OpenAPI-generated Angular client nếu tool tương thích stable và setup gọn; nếu viết typed service thủ công thì kiểm tra contract bằng integration/E2E, không giữ hai nguồn DTO tự sinh mâu thuẫn.

## 9. Authentication và bảo mật

Chọn cookie-based authentication cho first-party SPA cùng origin. Đây là quyết định mặc định có chủ đích để tránh token dài hạn trong localStorage.

- ASP.NET Core Identity + auth cookie HttpOnly; production Secure, SameSite phù hợp luồng cùng origin.
- Production gateway phục vụ SPA `/`, reverse proxy `/api` và `/hubs`; development Angular proxy giữ request browser cùng origin. Không dùng CORS wildcard + credentials.
- Antiforgery cho HTTP mutation, kể cả login/register/logout. Endpoint lấy request token; Angular gửi header `X-XSRF-TOKEN`; cookie request token `XSRF-TOKEN` có thể đọc bởi JS, khác auth cookie HttpOnly.
- Antiforgery integration theo tài liệu ASP.NET hiện tại; không tự cho rằng chỉ tạo cookie là đã bảo vệ. Kiểm tra Origin cho hub/browser connection phù hợp; không cho hub mutation lách HTTP antiforgery.
- SignalR dùng cookie auth cùng origin. Cấu hình WebSocket origin allowlist; xử lý session hết hạn/revocation, không giả định connection dài hạn tự nhận thay đổi session.
- Angular route guard chỉ phục vụ UX; authorization luôn ở server, cho cả REST và hub subscription.
- Membership kiểm tra theo resource/group. Không chỉ kiểm tra đăng nhập hoặc global role.
- Log out xóa session cookie; persist Data Protection keys ngoài container để restart không vô hiệu hóa mọi cookie. Production cần encryption-at-rest và shared key ring nếu scale nhiều instance.
- Không render tin nhắn bằng innerHTML/bypassSecurityTrustHtml; không log password, cookies, auth headers, raw invitation token hay body chat.
- Link mời cần hạn chế referrer, không analytics bên thứ ba ở trang accept; chuyển sang URL sạch khi đã xử lý và tránh token trong access log.
- Same-origin production mặc định không cần CORS; nếu bật cho môi trường khác phải allowlist cụ thể, ghi lý do.
- HSTS/TLS ở production gateway; forwarded headers chỉ trust proxy cấu hình, không trust mọi IP.
- Security headers phù hợp CSP với Angular; không giải quyết lỗi bằng tắt CSP hoặc thêm unsafe-eval tùy tiện.
- `.env`/credential/private keys không commit; `.env.example` chỉ placeholder. Script khởi tạo secret local không echo secret vào log.
- Chưa có email verification/reset password thực tế thì ghi hạn chế và chỉ pilot nhóm được mời; không quảng cáo đầy đủ account recovery.

## 10. Realtime và tính đúng của chat

- Hub có `[Authorize]` hoặc policy tương đương; tên subscription dựa group ID đã xác minh, không nhận tùy ý tên room mà client muốn join.
- Kiểm tra membership mỗi lần subscribe và gửi tin. Send ở REST; hub tối giản chỉ subscription/unsubscription.
- Server tự suy ra sender từ authenticated user, không tin senderId từ payload.
- Khi rời/bị xóa khỏi nhóm, connection phải mất quyền nhận tin nhóm ngay trong mô hình single instance. Groups phát notification nội bộ sau commit; Chat subscribe qua contract và loại connection liên quan khỏi room, kiểm tra quyền khi resubscribe.
- Xử lý race giữa subscribe và revoke; có kiểm thử nhận tin sau khi bị xóa. Không chỉ ẩn room trên UI. Session hết hạn cũng cần xử lý.
- Delivery contract MVP: database là nguồn thật, live notification best-effort sau commit. Nếu process chết giữa commit và broadcast, reconnect/refetch phải lấy được tin; không tuyên bố durable event delivery.
- Idempotency tin nhắn: cùng `(groupId, senderId, clientMessageId)` + cùng nội dung trả bản ghi cũ; cùng key khác nội dung trả 409. Unique constraint chống race.
- Stable pagination tránh mất/trùng tin khi timestamp bằng nhau; UI deduplicate message IDs và xử lý event đến không theo thứ tự.
- SignalR client automatic reconnect có bounded backoff; dừng retry vô hạn khi 401/403, resubscribe sau reconnect và tải phần bị thiếu.
- Frontend rời màn hình phải cleanup subscription, không tạo nhiều connection sau mỗi route navigation.
- Các thông báo realtime không phải audit log. Module không share một hub toàn năng có mọi nghiệp vụ.
- Document single-instance constraint. Scale-out sau này cần backplane/transport routing, distributed membership revocation và chiến lược connection; không chỉ tăng replica rồi tuyên bố hoạt động.

## 11. Logging, observability và audit

- Logging qua ILogger, provider Serilog structured JSON console; dùng message template, không string interpolation cho log fields.
- Request logging gồm method, route template, status, elapsed, traceId. Không ghi raw query chứa invitation token hoặc body.
- Correlation theo Activity/W3C trace context; nếu nhận correlation ID từ client phải validate/giới hạn, không tin tùy ý.
- OpenTelemetry traces ASP.NET Core/HttpClient/database với packages tương thích; metrics tối thiểu request/error/latency và connection count nếu triển khai hợp lý.
- OTLP exporter tùy chọn qua config; không cần cloud account để chạy local. Tránh duplicate traces/log exporters, không tạo collector stack nặng mặc định.
- Health endpoints tách live/ready; readiness kiểm tra PostgreSQL. Chi tiết dependency chỉ cho mạng nội bộ/được bảo vệ.
- Không đưa userId/groupId/messageId vào metric labels gây high cardinality; trace/log có thể dùng ID tối thiểu theo policy.
- Audit tối thiểu cho đổi owner, xóa member, tạo/thu hồi invite, chốt/hủy kèo: actor, action, entity ID, UTC time, traceId; không chứa token hoặc nội dung chat.
- Audit có tính bền vững: persist cùng transaction với mutation trong schema của module, cấu trúc thống nhất; không thay bằng console log.
- Hướng dẫn log level dev/prod, retention và cách tìm một lỗi bằng traceId. Không bật sensitive data logging EF trong production.

## 12. Frontend Angular và trải nghiệm mobile

### Kỹ thuật
- Dùng Angular CLI stable mới nhất đã kiểm tra, TypeScript strict, standalone components, lazy routes.
- Sử dụng signals cho state cục bộ/derived state và RxJS cho stream/HTTP/realtime khi hợp lý; không thêm NgRx chỉ để có tên công nghệ.
- Theo convention Angular hiện hành; OnPush nơi phù hợp. Kiểm tra zoneless support theo phiên bản, không sao chép setting cũ.
- Component có `.ts`, `.html`, `.scss`, `.spec.ts` khi có test ý nghĩa. Không inline template dài hoặc nhét mọi UI vào app component.
- Feature component không gọi HttpClient trực tiếp khắp nơi; typed API services, feature facade/store vừa đủ, connection service quản lý lifecycle.
- Reactive forms, error mapping ProblemDetails theo field, HTTP interceptor cho auth failure/error handling; không hiện 10 toast cho cùng lỗi.
- Không console.log dữ liệu nhạy cảm; production logging frontend tối thiểu.
- Auth state được lấy từ `/me`; không coi một flag trong localStorage là bằng chứng đăng nhập.
- Không cache dữ liệu chat/auth bằng service worker trong MVP. Nếu bổ sung PWA sau, xác định rõ private cache và logout cleanup.

### Giao diện
Phong cách: một không gian hội bạn ấm áp, gọn, hiện đại. Nền sáng dịu, xanh teal làm màu chính, màu ấm cho lời mời/kèo, typography rõ và nhiều khoảng thở. Không mặc định giao diện dashboard quản trị dày bảng hoặc gradient trang trí khắp nơi.

- Tạo design tokens cho màu, spacing, type scale, radius, elevation và trạng thái. Ghi docs/design-system.md trước khi nhân rộng UI.
- Mặc định Angular Material/CDK stable cùng major Angular, theme tùy biến; nếu chưa tương thích latest Angular thì dùng HTML semantic + SCSS và dependency tương thích đã xác minh. Không ép peer dependency bằng --force/--legacy-peer-deps.
- Dùng một bộ icon nhất quán, font có license rõ, ưu tiên system font hoặc self-host. Không phụ thuộc font CDN để app chạy được.
- Mobile navigation tối đa 3 mục rõ ràng: Trò chuyện, Kèo, Nhóm. Chưa có tính năng thì không tạo tab hoạt động giả.
- Desktop có thể dùng sidebar và vùng nội dung rộng; mobile ưu tiên một cột, bottom navigation, sheet/dialog thích hợp.
- Touch target khoảng 44px trở lên, hỗ trợ keyboard/focus, label cho icon button, contrast hướng tới WCAG 2.2 AA, reduced-motion.
- Chat composer không bị bàn phím che, có safe-area inset và dynamic viewport; thử 360/390/430px chiều rộng, cả landscape khi khả thi.
- Không cuộn ngang toàn trang; đoạn văn dài/URL dài wrap. Lịch sử chat không giật về cuối khi người dùng đang đọc tin cũ; có nút tin mới.
- Loading skeleton, empty state hữu ích, error có retry, unauthorized state, offline/reconnecting indicator và pending send rõ ràng.
- Form tạo kèo ngắn, lỗi cạnh field; thao tác chốt/hủy có xác nhận vừa đủ.
- Không nhét thông tin kiến trúc/.NET/AWS vào giao diện sản phẩm.

### Màn hình bắt buộc
Đăng nhập, đăng ký, danh sách nhóm/tạo nhóm, nhận lời mời, chat nhóm, danh sách kèo, tạo/sửa kèo, chi tiết kèo và RSVP, quản lý thành viên/link mời, hồ sơ/đổi mật khẩu/đăng xuất, trang 404.

Không mock dữ liệu trong màn hình thành phẩm. Test fixtures và seed Development là nơi đặt dữ liệu demo. Khi chưa có dữ liệu thật, dùng empty state có CTA.

## 13. Testing và quality gates

- Unit tests cho domain invariants và use cases có branching; không tạo test chỉ lặp lại getter/setter.
- Integration tests dùng PostgreSQL thật qua Testcontainers, WebApplicationFactory và migrations. Không dùng EF InMemory để kết luận truy vấn PostgreSQL đúng.
- Architecture tests kiểm tra dependency boundaries tại mục 6, gồm cả module references và forbidden types/namespaces.
- API tests: 400/401/403/404/409/429 phù hợp, antiforgery, auth cookie, không lộ dữ liệu nhóm khác, invite expired/revoked, duplicate join, owner transfer race.
- Chat tests: persist/history ordering, idempotent retry/concurrent duplicate, unauthorized subscribe/send, revoke membership khi đang connected, reconnect/replay không mất tin đã lưu.
- Events tests: RSVP duplicate/concurrent, thời gian UTC, chuyển trạng thái hợp lệ, conflict khi cùng sửa, không RSVP sau khi chốt/hủy.
- Frontend tests cho form validation, API error mapping và realtime state quan trọng; dùng runner hiện hành do Angular CLI hỗ trợ.
- Playwright E2E ít nhất một hành trình hai browser context: A tạo nhóm → B nhận lời mời → chat realtime → A tạo kèo → B Going → A chốt → B thấy trạng thái mới sau refresh. Kèm negative case người ngoài không vào được.
- E2E dùng cookie/antiforgery thật, không bypass auth trong đường chạy nghiệm thu.
- Kiểm tra responsive ít nhất 390×844 và desktop 1440×900; thêm 360px layout check. Browser emulation không thay thế hoàn toàn kiểm tra bàn phím mobile thật, ghi rõ phần chưa xác minh.
- Chụp screenshot local cho QA UI, sửa lỗi overflow/contrast/focus phát hiện được; không coi screenshot đẹp là test nghiệp vụ.
- CI: restore locked, build, architecture/unit/integration, format check, lint, frontend tests/build, E2E với dependency services. Có health wait và timeout rõ, không sleep cố định dài.
- Dependency audit phải đọc severity/advisory và ghi quyết định; không chạy audit fix --force để có log xanh.
- Không tắt test/analyzer hoặc giảm mức bảo mật chỉ để CI pass. Không báo integration passed nếu Docker chưa chạy.
- Không đặt coverage 100% hình thức; tập trung coverage nghiệp vụ và ranh giới bảo mật.

## 14. Local runtime, Docker và AWS

### Local
- Docker multi-stage backend, frontend build → nginx. Runtime non-root khi image phù hợp; pin version và lock dependencies.
- Compose có PostgreSQL + migrator one-shot + API + web gateway. Database healthy → migrator thành công → API start; web proxy tới API.
- Gateway cùng origin định tuyến SPA, `/api` và `/hubs`; hỗ trợ WebSocket upgrade và timeout phù hợp. API/hub route không bị SPA fallback trả index.html.
- SPA assets fingerprint cache dài; index.html và response riêng tư không cache public.
- Database named volume và Data Protection keys volume. Không mount source secrets hoặc Docker socket vào runtime API.
- `.env.example` chỉ placeholder. Script local tạo env/secret nếu chưa có, không ghi đè secret đang dùng, không in secret ra console; hướng dẫn Windows PowerShell và Bash.
- Một lệnh/script cho local up (bao gồm migrate), một lệnh chạy test, một lệnh down không xóa volume. Xóa dữ liệu phải là thao tác riêng có tên rõ.
- Hướng dẫn native debug: Postgres trong Docker; dotnet watch; Angular dev server + proxy config.
- Fresh clone procedure phải thực sự được thử, gồm DB trống và khởi động lại giữ dữ liệu.

### AWS — tài liệu, chưa provision
- Viết deployment guide cho EC2 Docker Compose single instance và phương án RDS PostgreSQL khi có nhu cầu; mô tả tradeoff tự quản DB/backup.
- Chưa cần ECS/Kubernetes/Terraform stack đầy đủ. Có thể thêm sau ADR riêng; không để “base” phụ thuộc dịch vụ cloud trả phí.
- Hướng dẫn TLS/domain/reverse proxy, security group, DB không public, secret injection/SSM, log rotation/CloudWatch tùy chọn, backup và restore.
- CI local repo có build/test. CD AWS chỉ hướng dẫn hoặc workflow manual riêng có environment gate và secret requirements, không tự deploy.
- Ghi rõ cách migrate trước release, rollback ứng dụng và giới hạn rollback khi schema đã đổi. Dùng expand/contract cho thay đổi phá tương thích khi cần.
- Không cam kết AWS miễn phí. Budget alerts không phải hard spending cap; ghi cách theo dõi và dọn tài nguyên.

## 15. Milestone thực thi từ số 0

Thực hiện theo thứ tự, cập nhật checklist sau mỗi milestone. Không dừng ở skeleton rồi coi đã hoàn thành. Có thể giảm chi tiết UI phụ nếu thiếu thời gian nhưng không cắt quyền truy cập, tính đúng dữ liệu hoặc giấu blocker.

| Mốc | Việc làm | Kiểm tra trước khi tiếp tục |
|---|---|---|
| M0 | Inspect môi trường; chọn/pin versions; tạo AGENTS, plan, ADR và skill setup | Version matrix có nguồn, repo không bị ghi đè |
| M1 | Scaffold .NET projects/references, Angular, PostgreSQL Compose, migrator, config | Restore/build cả hai; migration DB trống; architecture checks |
| M2 | Logging, ProblemDetails, validation, health, auth/antiforgery | Auth happy/negative tests; traceId và structured log hoạt động |
| M3 | Groups + membership + invitation + UI | Hai tài khoản tạo/join; token expiry/revoke; authorization tests |
| M4 | Chat persistence + REST send + SignalR + responsive UI | Hai browser chat; idempotency; disconnect/revoke tests |
| M5 | Events + RSVP + transition + UI | Tạo/tham gia/chốt kèo; concurrency/timezone tests |
| M6 | CI, Docker full flow, E2E, UI QA và security review | Fresh start + restart + checks thực tế |
| M7 | Runbook, API/realtime/database docs, roadmap, kết quả và limitations | Người khác chạy theo README được; báo cáo đúng bằng chứng |

Tại mỗi mốc: nêu thay đổi chính, chạy check liên quan, sửa lỗi rồi cập nhật progress. Nếu bị ngắt do thời lượng phiên, ghi chính xác bước tiếp theo và không mark done cho công việc chưa chạy.

## 16. Quyết định kiến trúc cần ghi ADR

Viết ngắn: context → decision → consequences → alternatives.
1. Modular monolith + Clean Architecture per module, single deployment.
2. PostgreSQL schema/DbContext ownership, không FK xuyên module.
3. Cookie same-origin + antiforgery, không token localStorage.
4. REST chat mutation + SignalR notifications, best-effort broadcast và replay.
5. Single instance ban đầu, đường đi scale-out sau.
6. Angular UI library/state/toolchain và mobile design.
7. Chọn handler/validation mechanism, license package và tránh framework thừa.

Không viết ADR tuyên bố đã có durable outbox hoặc distributed consistency khi chưa implement.

## 17. Skill AI, CodeGraph và công cụ hỗ trợ Codex

Phần này là yêu cầu Codex cài/cấu hình trong repository và môi trường phát triển đang chạy. Tài liệu này không đồng nghĩa skill đã được cài trên máy người dùng.

### Nguyên tắc cài
- Đọc tài liệu Codex hiện hành và skill-installer/skill-creator tích hợp nếu có. Không bịa lệnh cài, đường dẫn skill hay MCP tool.
- Ưu tiên repo-scoped `.agents/skills/<name>/SKILL.md` theo tài liệu hiện tại; không thay global settings khi repo scope đủ. Nếu client dùng cơ chế khác, giải thích và ghi rõ đường dẫn thực tế.
- Xem nguồn upstream, README/SKILL.md/scripts, license, phiên bản/commit trước khi cài. Pin commit/release và giữ attribution; không tải script rồi chạy qua curl|sh hoặc irm|iex chưa đọc.
- Chỉ skill/tool có ích cho stack này. Không cài hàng chục skill trùng nhau hoặc package frontend React vào Angular.
- Có thể cài package/browser dependency cần thiết theo quyền môi trường. Không tắt sandbox, không tự thêm quyền hệ thống, không dùng sudo để vượt blocker.
- Không upload code, DB dump, secret hoặc chat riêng tư cho dịch vụ indexing từ xa. Index code local; loại trừ `.env`, bin/obj, node_modules, dist, coverage, dữ liệu người dùng.
- Ghi `docs/skills-manifest.md`: tên, nguồn URL, version/commit, license, scope/path, cách gọi, cách kiểm tra, installed/blocked/optional và lý do.

### A. CodeGraph — ứng viên tùy chọn
- “CodeGraph” có nhiều dự án khác nhau. Ứng viên để đánh giá: https://github.com/sunerpy/codegraph-rust ; không tự coi đây chắc chắn là công cụ người dùng từng cài.
- Đọc tài liệu language support, kiểm tra C#, TypeScript và giới hạn Angular template/reflection/DI. Nếu thiếu hỗ trợ thì ghi phạm vi còn dùng được, không quảng cáo graph chính xác toàn bộ ứng dụng.
- Chọn release pin, kiểm tra checksum theo upstream; dùng lệnh CLI đã xác minh qua `--help` và README của đúng release.
- Ưu tiên CLI/local index trước, chỉ thêm MCP nếu cải thiện workflow. Tích hợp Codex bằng cơ chế cấu hình hiện hành, không copy JSON của client khác vào config Codex.
- Sau khi source có nội dung mới index; repo trống không có graph hữu ích. Smoke test truy vấn một symbol C# và một TypeScript component, kiểm tra kết quả với source thật.
- Chỉ đánh dấu installed/working sau smoke test. Nếu thiếu network/binary/language support, dùng `rg`, project reference graph và architecture tests; đây không phải blocker ứng dụng.
- Graph là chỉ dẫn phân tích tĩnh, không thay kiểm thử hoặc source thực tế; đọc lại file bị thay đổi trước khi edit.

### B. Frontend design
- Nguồn tham khảo để đánh giá: https://github.com/anthropics/skills/tree/main/skills/frontend-design . Kiểm tra tồn tại, license và nội dung tại thời điểm chạy, không giả định tương thích tự động với mọi Codex client.
- Nếu tương thích và license cho phép, cài repo scope, giữ attribution; áp dụng nguyên tắc typography/layout/color nhưng code phải theo Angular, không dùng React/Next.
- Nếu unavailable hoặc yêu cầu framework không phù hợp, tạo skill instruction-only riêng `campfire-mobile-ui`, dùng design-system.md và Angular chính thức làm nguồn. Không gọi skill tự viết là skill upstream.
- Dù cài skill nào, đầu ra phải được kiểm tra responsive, focus, empty/loading/error states bằng browser, không chỉ mô tả “giao diện đẹp”.

### C. Browser testing / Playwright
- Xem catalog chính thức https://github.com/openai/skills để chọn skill browser/Playwright hiện có nếu phù hợp; xác minh exact path/name trước khi cài.
- Nếu không có skill phù hợp, dùng Playwright test runner dependency của dự án và skill local hướng dẫn chạy test. Phân biệt skill (hướng dẫn agent), MCP (công cụ agent) và thư viện test (dependency dự án).
- Không cài nhiều browser automation tool trùng chức năng. Browser có thể cần download riêng; ghi chính xác nếu chưa cài/chưa chạy.

### D. Angular AI context / MCP
- Tham chiếu https://angular.dev/ai/develop-with-ai và https://angular.dev/ai/mcp .
- Tích hợp CLI MCP nếu phiên bản hỗ trợ, Codex client cho phép và thực sự hữu ích; ghi rõ trạng thái experimental nếu tài liệu hiện hành vẫn đánh dấu như vậy.
- Pin Angular CLI local trong frontend, không để cấu hình MCP tự tải `@latest` mỗi phiên rồi lệch toolchain.
- Nếu dùng local CLI, chỉ cấu hình command/path hợp lệ đã kiểm tra ở OS hiện tại; không bịa config dùng chung Windows/Linux.
- Không cần MCP để build thành công. Context file/official docs là phương án thay thế.

### E. Skill nội bộ nên tạo

Nếu không có skill tương đương, author các skill instruction-only ngắn, có YAML `name` và `description` nêu trigger rõ; nội dung dùng tài liệu repo làm nguồn, không sao chép toàn bộ spec vào mọi skill. Đồng bộ chúng bằng git cùng repo khi có quyền commit; không push remote tự động.

| Skill local | Khi dùng | Checklist chính |
|---|---|---|
| campfire-module-feature | Thêm/sửa use case backend | Layer, contracts, auth, validator, transaction, migration và test |
| campfire-mobile-ui | Xây/sửa Angular screen | Tokens, mobile, accessibility, loading/error và browser QA |
| campfire-security-review | Đổi auth, membership, chat hoặc invite | Resource auth, CSRF, secret/log redaction, realtime revocation |
| campfire-db-change | Đổi model/query/schema | Ownership, migration, indexes, concurrency, PostgreSQL tests |
| campfire-verify | Trước khi báo hoàn thành | Đọc script thật, chạy checks liên quan, ghi bằng chứng và blockers |

Không tạo skill tự chạy deploy, tự xóa DB hoặc bỏ qua permission. Tạo `docs/skills-manifest.md` và một hướng dẫn cách gọi `$<skill-name>` nếu client hỗ trợ.

## 18. Definition of Done và bàn giao

Chỉ kết luận hoàn thành khi các điều sau được thực hiện hoặc đánh dấu blocker rõ ràng:

### Chức năng
- Hai tài khoản thật có thể tạo nhóm/join, chat, tạo kèo, RSVP và chốt kèo từ UI.
- Refresh/restart không mất dữ liệu đã lưu; reconnect không làm mất lịch sử chat.
- Người ngoài nhóm không đọc được tin/kèo hoặc subscribe hub.
- Người bị xóa khỏi nhóm không tiếp tục nhận chat trên connection cũ.
- Retry tin nhắn không tạo bản sao; conflict đúng khi payload khác cùng key.

### Source và chất lượng
- Các `.csproj`, file class và Angular component tách đúng cấu trúc; Program.cs chỉ wiring.
- Không TODO/NotImplementedException ở đường chạy MVP. Những thứ chưa làm được ghi roadmap, không fake success.
- Migrations được áp dụng từ DB trống, và restart không làm seed/migrate sai.
- Logging/ProblemDetails/validation/authorization có bằng chứng chạy.
- Architecture tests, unit, integration, frontend checks, E2E và responsive QA có kết quả ghi nhận.
- Không secret thật trong source/log/screenshot/fixtures; dependency versions/license được kiểm tra.
- Docker Compose có thể chạy và health status đúng. Không chỉ build image mà bỏ chạy smoke test.

### Tài liệu
- README: prerequisites, quick start Bash/PowerShell, env config, ports, native debug, migrations, tests, troubleshooting, reset dữ liệu có cảnh báo.
- Architecture/database/API/realtime/design/security/operations docs đúng với code cuối cùng.
- `docs/verification.md`: command, thời điểm, kết quả, phiên bản, test count nếu tool cung cấp, giới hạn môi trường; không bịa output.
- `docs/progress.md`: đã xong, chưa xong, quyết định và bước tiếp theo. Không giữ checklist cũ sau khi scope thay đổi.
- `infra/aws/README.md`: triển khai minh họa, cost considerations, backup/restore, rollback; chưa tạo tài nguyên thật.
- Kết quả cuối: cách chạy ngắn gọn, đường dẫn chính, checks passed/failed/not run, hạn chế và ưu tiên tiếp theo.

Không gọi nền tảng là production-ready chỉ vì có logging và test. Pilot với nhóm bạn trước, theo dõi vận hành rồi harden theo dữ liệu thật.

## 19. Codex instructions — nội dung tạo thành AGENTS.md

Tạo `AGENTS.md` ở root theo nội dung dưới đây. Đây là instruction lâu dài; spec chi tiết nằm trong tài liệu này và docs/. Giữ instructions gọn, cập nhật lệnh thực tế sau khi scaffold.

```markdown
# Campfire — Agent Instructions

## Product and scope
- Private friend-group app. Current MVP: Identity, Groups, text Chat, Events/RSVP.
- Funds, Plans, Werewolf, Voice are roadmap only unless explicitly requested.
- Read Campfire-Codex-Bootstrap.md, docs/architecture.md, docs/implementation-plan.md and docs/progress.md before substantial changes.
- Treat implemented code + current tests + accepted ADRs as the current state; reconcile stale docs explicitly.

## Architecture
- One deployable .NET backend, modular monolith; Angular SPA; PostgreSQL.
- Each module owns Domain, Application, Infrastructure, Presentation, Contracts and its database schema/DbContext.
- Domain has no framework/infrastructure dependency. Application has no Infrastructure/Presentation dependency.
- Cross-module references only through Contracts. Never access another module's DbContext/entities/tables.
- Host is composition only. Keep BuildingBlocks minimal; no business entities in shared code.
- One top-level type per file; separate commands, handlers, validators, DTOs, endpoints and EF mappings.
- Angular components use separate TypeScript/template/style files; organize by feature and lazy routes.

## Correctness and security
- Authorization is server-side and resource/group-scoped, including SignalR subscriptions.
- Same-origin Identity cookies + antiforgery for HTTP mutations. No auth tokens in localStorage.
- Never log passwords, cookies, authorization headers, invite tokens, chat bodies or private game roles.
- Validate input in Application; preserve Domain invariants and database constraints under concurrency.
- PostgreSQL migrations per module; UTC timestamps; bounded pagination; cancellation propagated.
- Persist chat before broadcast; idempotent clientMessageId; reconnect reconciles from database.
- Membership removal must revoke realtime access; hiding UI is insufficient.
- Use ProblemDetails and structured logs with traceId; no swallowed errors or fake success.
- Keep secrets out of git. No paid AWS provisioning, public publishing or remote push unless requested.

## Working method
- Inspect the repository and existing changes before editing; preserve user work.
- Prefer rg/targeted reads. Use CodeGraph only when installed and relevant; verify against current source.
- Use available relevant skills. Missing optional skills/tools do not block ordinary development.
- Verify official documentation and version compatibility before introducing dependencies or unfamiliar APIs.
- Do not invent CLI flags, skill availability, package versions, tool results or benchmark claims.
- Implement a complete vertical slice, then run relevant checks and update progress/docs.
- For large changes, maintain a file-based plan; continue authorized local work without asking after every step.
- Ask only for material ambiguity, destructive actions, credentials or paid external actions.
- Never delete volumes, rewrite git history, disable tests/security, or overwrite secrets to make checks pass.
- Do not introduce microservices, brokers, Redis, Kubernetes or frameworks without a concrete requirement and ADR.

## Verification and handoff
- Run formatting/build, relevant unit/integration/architecture tests and frontend lint/tests/build after changes.
- Use real PostgreSQL for database integration tests; no EF InMemory substitute.
- Run Playwright for changed user journeys and mobile layouts when browser/runtime is available.
- Commands live in README and package scripts; inspect actual commands rather than guessing them.
- Record exact checks and blockers in docs/verification.md. Never mark unexecuted checks passed.
- Update docs/progress.md with the next actionable step before stopping.
- Final response in Vietnamese: outcome, how to run, checks performed, limitations. Code identifiers in English.
```

Ngoài root, tạo `backend/AGENTS.md` và `frontend/AGENTS.md` ngắn, kế thừa quy tắc trên:
- Backend: dependency graph, schema ownership, cách add migration/test, log redaction, auth/antiforgery, actual dotnet commands.
- Frontend: design tokens, component split, signals/RxJS, auth/error handling, safe rendering, responsive QA và actual npm commands.
- Không lặp nguyên spec ở mọi cấp, không tạo instruction mâu thuẫn hoặc lệnh chưa tồn tại.

### Nếu muốn thêm vào ô Custom Instructions của Codex

```text
Trong Campfire, đọc AGENTS.md và docs/progress.md trước khi làm việc. Giữ .NET modular monolith và Clean Architecture theo module; giao tiếp qua Contracts; PostgreSQL schema/DbContext riêng. Tách code thành file đúng trách nhiệm, không gom vào Program.cs hay component lớn. Mỗi feature phải có server authorization, validation, lỗi có kiểu, structured logging không lộ dữ liệu nhạy cảm và kiểm thử phù hợp. Frontend Angular mobile-first, kết nối API thật và xử lý loading/error/reconnect. Xác minh dependency/API bằng nguồn chính thức. Tự hoàn thành các bước local đã được yêu cầu, cập nhật progress và chạy checks; không chỉ trả kế hoạch. Không tuyên bố test đã pass khi chưa chạy, không tự provision AWS/push/publish, không xóa dữ liệu hoặc tắt bảo mật để vượt lỗi. Trả lời tiếng Việt, code tiếng Anh.
```

## 20. Prompt tiếp tục và bổ sung feature

### Tiếp tục phiên đang dở
```text
Đọc AGENTS.md, Campfire-Codex-Bootstrap.md, docs/implementation-plan.md, docs/progress.md và docs/verification.md. Kiểm tra git diff và trạng thái source hiện tại. Tiếp tục từ milestone chưa hoàn thành gần nhất, không scaffold lại hoặc ghi đè việc đã làm. Chạy lại kiểm tra chỉ khi cần do thay đổi hoặc kết quả cũ chưa đủ. Hoàn thành phần còn lại và cập nhật bằng chứng cùng blockers.
```

### Thêm một feature sau MVP
```text
Triển khai feature: [mô tả]. Đọc instructions và ADR hiện tại. Trước hết xác định module sở hữu, use cases, quyền truy cập, contract, dữ liệu/migration và acceptance criteria; ghi plan ngắn. Thực hiện một vertical slice từ Domain/Application tới API, PostgreSQL và Angular. Tách file đúng trách nhiệm, không truy cập xuyên module. Bổ sung test có ý nghĩa, kiểm tra UI mobile, cập nhật OpenAPI/docs và chạy quality gates liên quan. Không tự mở rộng scope sang module khác ngoài nhu cầu feature.
```

## 21. Nguồn tham khảo để Codex xác minh lại

Các đường dẫn là nguồn tham khảo, không phải bằng chứng đã cài công cụ trên máy người dùng.

- .NET support: https://dotnet.microsoft.com/en-us/platform/support/policy
- ASP.NET architecture: https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures
- Angular releases: https://angular.dev/reference/releases
- Angular compatibility: https://angular.dev/reference/versions
- Angular AI context: https://angular.dev/ai/develop-with-ai
- Angular CLI MCP: https://angular.dev/ai/mcp
- Npgsql EF provider: https://www.npgsql.org/efcore/
- PostgreSQL version policy: https://www.postgresql.org/support/versioning/
- Codex skills: https://developers.openai.com/codex/skills/
- Codex AGENTS.md: https://developers.openai.com/codex/guides/agents-md/
- OpenAI skills catalog: https://github.com/openai/skills
- Frontend design skill candidate: https://github.com/anthropics/skills/tree/main/skills/frontend-design
- CodeGraph candidate: https://github.com/sunerpy/codegraph-rust
- Playwright: https://playwright.dev/docs/intro
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/

Yêu cầu nghiệm thu và thiết kế Campfire trong tài liệu là đề xuất riêng cho dự án, không phải chuẩn bắt buộc của các nhà cung cấp trên.
