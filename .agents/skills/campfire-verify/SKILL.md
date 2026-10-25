---
name: campfire-verify
description: Verify a Campfire change before completion by running real repository checks and recording reproducible evidence and blockers.
---

Read package scripts, solution files and `docs/verification.md`; never guess commands. Select checks proportional to the change: format, locked restore, build, unit/architecture/integration, lint/frontend tests/build and Playwright. Integration evidence requires real PostgreSQL. Inspect failures and fix regressions caused by the change. Record exact commands/results and update `docs/progress.md`; distinguish passed, failed and not run.
