---
name: campfire-security-review
description: Review Campfire authentication, membership, invitations, chat, events or realtime changes for privacy and access-control regressions.
---

Trace authorization from HTTP/hub entry to the resource and group membership check. Verify cookie/antiforgery behavior, invite-token hashing/redaction, SignalR revocation, safe rendering, rate limits and ProblemDetails without infrastructure leakage. Search logs/tests for passwords, cookies, headers, raw tokens and chat bodies. Report actionable findings by severity and add regression tests for corrected issues.
