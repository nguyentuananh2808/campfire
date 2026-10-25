# ADR 003: Cookie auth and antiforgery

Context: the SPA is first-party and same-origin. Decision: ASP.NET Core Identity HttpOnly cookie plus antiforgery header/cookie for mutations. Consequences: no long-lived browser token storage; gateway/proxy must preserve same origin. Alternative rejected: localStorage bearer tokens increase exposure.
