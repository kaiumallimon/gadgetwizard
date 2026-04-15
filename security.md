Findings (Ordered by Severity)

High: No rate limiting on public auth endpoints, so brute-force and abuse risk is currently open.
Evidence: route.ts:13, route.ts:11.
Impact: Repeated calls can be used for credential-flow abuse, reset-email flooding, and resource exhaustion.
Recommended fix: Add per-IP and per-identifier throttling on auth/session and all password-reset endpoints with explicit 429 handling.

High: Account disable and role changes are not enforced immediately for existing JWTs.
Evidence: guards.ts:8, session.ts:44, env.ts:14, auth-service.ts:40, user-repository.ts:184.
Impact: A user/admin deactivated in DB can continue using already-issued backend JWTs until expiry (default 24h).
Recommended fix: Re-validate user status/role on protected requests or add token version/revocation checks and shorten token lifetime.

High: CDN upload path has no server-side MIME and max-size enforcement before forwarding file content.
Evidence: route.ts:15, cdn-service.ts:129, cdn-service.ts:130, cdn-service.ts:135.
Impact: Risk of unexpected file types and oversized uploads being sent downstream.
Recommended fix: Enforce allowlist MIME checks, extension/magic-byte validation, and strict max size in server code before upload.

Medium: Reset and admin-invite URLs derive from request origin when APP_BASE_URL is not set, which can enable host-header link poisoning in some deployments.
Evidence: route.ts:16, password-reset-service.ts:25, route.ts:35, admin-service.ts:69, env.ts:16.
Impact: Emails could contain attacker-controlled domains if upstream host validation is weak.
Recommended fix: Require APP_BASE_URL in production and avoid request-origin fallback for security-sensitive links.

Medium: Session token is returned in API response and persisted client-side, increasing token-theft impact under XSS.
Evidence: route.ts:21, auth-store.ts:17, auth-store.ts:24, auth-store.ts:36.
Impact: Any successful script injection can exfiltrate long-lived auth material from browser storage.
Recommended fix: Prefer HttpOnly cookie-only auth in browser flows and avoid persisting bearer tokens in local storage.

Medium: Stored XSS exposure exists through product description HTML path.
Evidence: schemas.ts:68, page.tsx:249.
Impact: Malicious HTML entered via admin product APIs can execute in storefront clients if not sanitized.
Recommended fix: Sanitize rich HTML server-side on write or sanitize on render with a robust sanitizer and strict allowlist.

Low: Audit metadata stores raw query string, user agent, and forwarded IP headers directly.
Evidence: route-audit.ts:121, route-audit.ts:122, route-audit.ts:123.
Impact: Sensitive values may end up in logs and forwarded IP may be spoofed depending on proxy trust setup.
Recommended fix: Redact sensitive query keys and normalize/trust proxy chain before persisting IP.

Low: Error handling returns HttpError details to clients and logs raw unexpected errors.
Evidence: http.ts:35, http.ts:55, route-audit.ts:175.
Impact: Potential internal detail leakage depending on what upstream errors contain.
Recommended fix: Return minimal client-safe details and use structured redacted server logging.

What Looks Secure

Admin API authorization coverage is good: all admin route files include admin-role guard checks.
User-bound APIs for cart/me are consistently protected with auth guards.
Cookie settings include HttpOnly and SameSite=Strict, which is a strong baseline against cross-site request abuse.
Request body validation with schemas is broadly and consistently applied.
Assumptions / Residual Risk

Host-header poisoning severity depends on your deployment/proxy trust model.
Upload severity depends partly on what the external CDN endpoint already enforces.
This was a static code audit, not an active penetration test.
If you want, I can implement the top 3 fixes now (rate limit layer, upload validation, and forced APP_BASE_URL for security links).
I can also do a second pass focused only on XSS hardening paths (product/faq rich HTML) and ship concrete sanitization patches.