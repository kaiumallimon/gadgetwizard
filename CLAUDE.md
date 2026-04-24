@AGENTS.md

# Claude Code Project Context: GadgetWizard

This is the concise rules-first context for Claude Code in this repository.

## 1. Scope

- Full-stack ecommerce in Next.js App Router.
- Includes storefront, user dashboard/cart, admin panel, and internal API.
- Checkout/order/payment flow is intentionally out of scope right now.

## 2. Read First (Source of Truth)

- AGENTS.md
- node_modules/next/dist/docs/ (required before changing Next.js behavior)
- BACKEND.md
- FRONTEND.md
- security.md

## 3. Stack

- Next.js 16.2.2, React 19.2.4, TypeScript (strict)
- Tailwind CSS v4
- NextAuth v5 beta (Credentials, JWT sessions)
- MySQL via mysql2/promise
- Zod, Zustand, Nodemailer, JOSE

## 4. Code Map

- app/: pages/layouts + route handlers
- app/api/**/route.ts: API entrypoints
- components/, components/admin/: UI and feature components
- lib/client/: frontend API client/types
- lib/stores/: Zustand stores
- lib/server/: backend core/auth/services/repositories/mail/middleware
- migrations/: ordered SQL migrations (001-019)
- types/next-auth.d.ts: NextAuth type augmentation

API surface rule:
- Do not maintain a full endpoint list in this file.
- Derive current endpoints directly from app/api/**/route.ts.

## 5. Backend Rules

1. Keep route handlers thin.
2. Parse inputs with parseJsonBody / parseSearchParams + Zod schemas.
3. Apply requireAuth / requireRole for protected routes.
4. Put business logic in services and SQL in repositories.
5. Use handleRouteError for route error mapping.
6. Wrap route exports with withRouteAudit.
7. Use no-store headers for sensitive/auth/admin responses.

## 6. Auth Model

- Primary auth: NextAuth Credentials in lib/server/auth/next-auth.ts.
- Server component/session helpers: lib/server/auth/server-session.ts.
- API guards: lib/server/auth/guards.ts.
- Legacy bearer verification path still exists in lib/server/auth/session.ts.
- /api/auth/session is deprecated and should stay 410 unless explicitly redesigned.

## 7. Data + Product Constraints

- Categories are flat (no parent hierarchy).
- Product metadata uses JSON-backed fields.
- SKU uniqueness is enforced.
- Category delete is blocked when products reference it.
- Product delete is blocked when cart_items reference it.
- Max header categories: 8.
- At least one active admin must remain.

## 8. Environment

- Runtime env validation: lib/server/core/env.ts.
- Core required vars: DB_HOST, DB_USER, DB_NAME, AUTH_SECRET, JWT_SECRET, CDN_BASE_URL.
- SMTP and CDN admin features are env-gated.

## 9. Frontend State + API

- API client: lib/client/api.ts.
- Auth store: lib/stores/auth-store.ts.
- Cart store: lib/stores/cart-store.ts.
- app/layout.tsx + components/layout-chrome.tsx control global chrome behavior.

## 10. Commands

- npm install
- npm run dev
- npm run lint
- npm run build
- npm run start

## 11. Editing Rules for Claude Code

- Preserve service/repository separation.
- Keep API response shapes compatible with lib/client/types.ts.
- Keep admin role checks on all admin paths.
- Reuse existing schema/validation patterns before introducing new ones.
- Keep migration names zero-padded incremental SQL files.
- Keep security policies and risk notes in security.md (not here).
- Respect .claudeignore for context efficiency: do not scan .next/ or node_modules/ during normal work.
- Exception: when changing Next.js behavior, read node_modules/next/dist/docs/ as required.
- Update this file only when architecture/workflow rules change.

