---
name: campfire-module-feature
description: Implement or change an Campfire backend use case across Clean Architecture layers without crossing module ownership boundaries.
---

Read `docs/architecture.md`, the relevant ADRs and module instructions. Identify acceptance criteria, module owner and resource authorization. Keep Domain framework-free; place orchestration/validation in Application, persistence in Infrastructure, thin HTTP in Presentation and only true cross-module contracts in Contracts. Every HTTP use case must follow `endpoint -> ISender -> command/query handler -> injected Application interface -> Infrastructure implementation`; never let an endpoint call a handler or infrastructure service directly, and never let an Application handler reference Infrastructure. Run FluentValidation through a MediatR pipeline behavior. Add database constraints/migration and focused unit/integration/architecture tests. Update API/database/progress docs and record commands actually run.
