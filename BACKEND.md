# Next.js App Router Backend

This project now includes a modular backend inside the Next.js App Router.

## Architecture

- app/api: HTTP route handlers
- lib/server/core: env, db, errors, HTTP helpers, request parsing
- lib/server/auth: Firebase verification, JWT, session parsing, RBAC guards
- lib/server/repositories: SQL data access
- lib/server/services: business logic
- lib/server/utils: helpers (slug, CDN URL validation)

## Auth Flow

1. Client signs in with Firebase
2. Client sends Firebase `idToken` to `POST /api/auth/session`
3. Server verifies token with Firebase Admin SDK
4. Server upserts user and issues backend JWT
5. JWT is returned and also set as HttpOnly cookie
6. Protected endpoints use `Authorization: Bearer <jwt>` or cookie session

## Endpoint Summary

Public:
- GET /api/categories
- GET /api/products
- GET /api/products/{slug}

User:
- POST /api/auth/session
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
- POST /api/admin/products
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
