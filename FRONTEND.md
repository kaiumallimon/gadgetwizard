# Frontend Overview

## Implemented Pages

- / : Public storefront home with banner showcase, category links, featured products
- /category/[slug] : Category product listing
- /product/[slug] : Product details + add to cart
- /cart : Auth-required cart management (quantity update/remove)
- /login : Firebase email/password login/signup and backend token exchange
- /dashboard : Auth-required user dashboard (profile, rewards, cart overview)
- /admin : Admin-only dashboard with analytics + CRUD for categories, products, banners

## UI/UX Notes

- App Router server components are used for data-heavy pages
- Client components are used for interactivity (auth, add to cart, CRUD actions)
- Zustand stores:
  - `useAuthStore` for session/user/token state
  - `useCartStore` for cart state persistence

## API Abstraction

- Frontend API layer is centralized in `lib/client/api.ts`
- All auth and CRUD requests go through this abstraction with credentials included

## Auth-aware Routing

- `app/dashboard/layout.tsx` checks for authenticated session
- `app/admin/layout.tsx` enforces admin role
- `/login` handles Firebase auth and backend JWT session establishment

## Banner Feature

- Home page reads public banners from `GET /api/banners`
- Admin banner CRUD available under `/admin` via:
  - `GET /api/admin/banners`
  - `POST /api/admin/banners`
  - `PUT /api/admin/banners/{id}`
  - `DELETE /api/admin/banners/{id}`
- Banners support desktop image, mobile image, optional click URL, scheduling window, and active flag
