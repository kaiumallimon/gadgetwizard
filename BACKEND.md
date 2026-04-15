# Next.js App Router Backend

This project now includes a modular backend inside the Next.js App Router.

## Architecture

- app/api: HTTP route handlers
- lib/server/core: env, db, errors, HTTP helpers, request parsing
- lib/server/auth: NextAuth config, JWT session parsing, RBAC guards
- lib/server/repositories: SQL data access
- lib/server/services: business logic
- lib/server/utils: helpers (slug, CDN URL validation)

## Auth Flow

1. User registers via `POST /api/auth/register` (password stored as bcrypt hash in MySQL)
2. User signs in with NextAuth Credentials provider (`/api/auth/callback/credentials`)
3. NextAuth issues JWT session cookie
4. Protected endpoints read the session via NextAuth and enforce role checks
5. Password reset uses SMTP + one-time JWT reset tokens + MySQL token fingerprints

## Endpoint Summary

Public:
- GET /api/categories
- GET /api/products
- GET /api/products/{slug}
- GET /api/banners

User:
- POST /api/auth/register
- POST /api/auth/logout
- GET /api/me
- GET /api/cart
- POST /api/cart/add
- PATCH /api/cart/update
- DELETE /api/cart/remove

Admin:
- GET /api/admin/categories
- POST /api/admin/categories
- PUT /api/admin/categories/{id}
- DELETE /api/admin/categories/{id}
- GET /api/admin/banners
- POST /api/admin/banners
- PUT /api/admin/banners/{id}
- DELETE /api/admin/banners/{id}
- POST /api/admin/products
- GET /api/admin/products
- PUT /api/admin/products/{id}
- DELETE /api/admin/products/{id}
- GET /api/admin/analytics

## Security Notes

- Strict env validation with zod
- Parameterized SQL queries via mysql2
- RBAC authorization in every admin route
- Input validation with zod in all mutating routes
- HttpOnly session cookie support
- CDN URL allow-list validation for product images
- No checkout/order implementation yet by design
