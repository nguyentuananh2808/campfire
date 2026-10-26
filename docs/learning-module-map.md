# Học quanh lửa — bản đồ triển khai

Ngày cập nhật: 26/10/2026

## Kiến trúc đã triển khai

```mermaid
flowchart LR
    UI[Angular /learning] --> API[LearningEndpoints]
    API --> Sender[ISender / MediatR]
    Sender --> Handler[Command hoặc Query Handler]
    Handler --> Port[ILearningService]
    Port --> EF[EfLearningService]
    EF --> DB[(PostgreSQL schema learning)]
    UI --> Path[Lộ trình HSK1]
    UI --> Map[Bản đồ từ vựng]
    Path --> Curriculum[Curriculum version 1.0]
    Map --> Graph[Vocabulary relation graph]
```

HSK1 là dữ liệu seed có version. Learning Engine là code dùng chung, vì vậy thêm HSK2, HSK3 hoặc khóa giao tiếp không cần tạo controller/component riêng cho từng ngày.

## Bài toán nhỏ, giải pháp và vị trí code

| Bài toán | Cách giải quyết | File chính |
|---|---|---|
| Giữ modular monolith | Module riêng đủ Domain, Application, Infrastructure, Presentation, Contracts; Host chỉ composition | `backend/src/Modules/Learning/*`, `backend/src/Host/Campfire.Api/Composition/*` |
| Dispatch đúng MediatR | Endpoint gọi `ISender`; handler chỉ gọi port Application | `LearningEndpoints.cs`, `*CommandHandler.cs`, `*QueryHandler.cs` |
| Curriculum không hard-code ở UI | Course/Unit/Day/Activity và JSON content được seed bằng migration idempotent | `LearningSeed.cs`, `Migrations/*InitialLearning.cs` |
| Không lộ đáp án | Loại `correctAnswer` trước khi trả activity; chấm server-side | `ExerciseScorer.cs`, `EfLearningService.cs` |
| Không cộng XP lặp | PK `(UserId, ActivityId)`, transaction Serializable và hoàn thành day idempotent | `UserActivityProgress.cs`, `UserLearningDayProgress.cs`, `EfLearningService.cs` |
| Mở khóa tuần tự | Ngày N yêu cầu ngày N-1 `Completed`, kiểm tra lại ở mọi mutation | `EfLearningService.CanAccessDayAsync` |
| Không xuyên schema Identity | Chỉ lưu `UserId` UUID, không FK/navigation tới schema `identity` | `LearningDbContext.cs` |
| Mind map chưa có AI provider | Trả graph curriculum đã kiểm duyệt; từ ngoài dữ liệu trả lỗi rõ ràng | `GetMindMapQuery*`, `EfLearningService.GetMindMapAsync` |
| Không dựng nút AI giả | Capability API công bố provider đang tắt; UI giải thích giới hạn | `GetCapabilitiesQuery*`, `learning-page.html` |
| Bảo vệ mutation | Identity authorization, antiforgery, FluentValidation và ProblemDetails có traceId | `LearningEndpoints.cs`, `AntiforgeryEndpointFilter.cs`, validators |
| Mobile/dark mode | Semantic design tokens, layout một cột dưới 900px, touch target 44px | `frontend/src/app/features/learning/learning-page.scss` |

## Mô hình dữ liệu

```mermaid
erDiagram
    COURSE ||--o{ COURSE_UNIT : contains
    COURSE ||--o{ LEARNING_DAY : versions
    COURSE_UNIT ||--o{ LEARNING_DAY : groups
    LEARNING_DAY ||--o{ LESSON_ACTIVITY : contains
    COURSE ||--o{ USER_COURSE : enrolls
    LEARNING_DAY ||--o{ USER_DAY_PROGRESS : tracks
    LESSON_ACTIVITY ||--o{ USER_ACTIVITY_PROGRESS : tracks
    VOCABULARY ||--o{ VOCABULARY_RELATION : source
    VOCABULARY ||--o{ VOCABULARY_RELATION : target
```

- Unique: course slug, `(CourseId, DayNumber)`, `(LearningDayId, OrderIndex)`, progress composite keys, `(Chinese, HskLevel)`.
- Check constraint: HSK 1–6, score/progress 0–100, XP không âm, allow-list status/activity/relation.
- Thời gian enrollment/completion dùng UTC `timestamptz`.
- Rollback migration đầu tiên xóa schema Learning và toàn bộ progress; production phải sao lưu trước khi rollback.

## Luồng học đang chạy

```mermaid
sequenceDiagram
    participant U as User
    participant A as Angular
    participant M as MediatR
    participant L as Learning Service
    participant P as PostgreSQL
    U->>A: Mở Học quanh lửa
    A->>M: GET path + today
    M->>L: Query handlers
    L->>P: Curriculum + progress
    P-->>A: Day 1 available, Day 2 locked
    U->>A: Hoàn thành vocabulary/sentence/grammar
    A->>M: POST complete + antiforgery
    U->>A: Nộp exercise
    A->>M: POST answers
    M->>L: Chấm và finalize transaction
    L->>P: Progress + XP
    P-->>A: Day 1 completed, Day 2 unlocked
```

## Chưa giả lập

TTS, upload microphone, pronunciation/tone assessment, conversation AI, AI vocabulary expansion và smart review chưa hoạt động vì chưa có provider/credential/storage. Phase sau phải thêm Application port và Infrastructure adapter; endpoint không được gọi provider trực tiếp.
