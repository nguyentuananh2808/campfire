# Toolchain

Verified 2026-10-15.

| Component | Pin | Evidence / compatibility |
|---|---|---|
| .NET | SDK 10.0.112; runtime servicing 10.0.12; `net10.0` | .NET 10 is active LTS through 2028-11-14: https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core |
| Angular | 22.x stable | Active release: https://angular.dev/reference/releases |
| Node.js | 24.18.0 | Angular 22 supports `^24.15.0`: https://angular.dev/reference/versions |
| TypeScript | CLI-managed `>=6.0 <6.1` | Angular compatibility table above. |
| PostgreSQL | 18.6 image | PostgreSQL 18 supported through 2030-11-14: https://www.postgresql.org/support/versioning/ |
| Testcontainers.PostgreSql | 4.16.0 | Current stable NuGet package (MIT); 4.8.1 was rejected because its SSH.NET dependency had high-severity advisories. |
| MediatR | 12.5.0 | Pinned stable mediator API for every module; later license-key-requiring major versions are intentionally not used. |
| Package managers | npm 11.16.0; NuGet lock files | npm bundled locally; NuGet packages centrally managed. |

EF Core, Npgsql and ancillary package versions are pinned after restore against their official package metadata. Docker is currently unavailable, so the PostgreSQL image cannot yet be smoke-tested.
