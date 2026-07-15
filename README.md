# GadgetWizard

**Australia's trusted tech e-commerce platform for phones, gadgets, accessories, and wearables.** GadgetWizard is a production-grade, full-featured online store built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, and MySQL — combining a polished public storefront with a comprehensive admin backoffice.

---

## Storefront

### Homepage

The homepage is a server-rendered, Suspense-bounded page that fetches banners, brands, and up to 48 products in parallel, then curates them into scannable horizontal scroll rows:

| Section | What it shows |
|---|---|
| **Banner Showcase** | Auto-rotating carousel with scheduled, clickable campaign banners |
| **Brand Marquee** | Infinite-scroll animated row of featured brand logos |
| **Service Highlights** | Free Shipping, 24/7 Self Pickup, Online Support, Secure Payment |
| **Featured** | Handpicked products with strong value and demand |
| **New Arrivals** | Freshly listed items just added to the storefront |
| **Trending** | Top trends shoppers are viewing right now |
| **Top Rated** | Highly rated picks trusted by verified shoppers |
| **Best Seller** | Most purchased products this week |
| **Free Delivery** | Products eligible for free shipping |
| **Official Warranty** | Products backed by official warranty coverage |
| **About Gadget Wizard** | Informational content blocks about the store |

Each product row uses a horizontally scrollable client component (`ProductScrollRow`) with left/right navigation arrows and intersection-observer-based scroll state.

### Product Catalog & Discovery

- **Category Pages** (`/category/[slug]`) — Filtered product listing with pagination, facets, and sort options
- **Brand Pages** (`/brand/[slug]`) — All products for a given brand
- **All Brands** (`/brands`) — Directory of all active brands
- **All Categories** (`/categories`) — Category grid with images and featured flags
- **New Arrivals** (`/new-arrivals`) — Latest product additions
- **Best Sellers** (`/best-sellers`) — Top-performing products
- **Offers** (`/offers`) — Discounted and promotional products
- **Search** (`/search`) — Full-text product search with query parameter support

### Product Detail Page (`/product/[slug]`)

- **Image Gallery** — Main image with zoom-on-hover (CSS transform scaling), thumbnail strip for switching
- **Pricing** — Original price, discounted price, wholesale price (for approved business accounts)
- **Badge Flags** — Limited Stock, Free Delivery, Cash on Delivery, EMI Available, Official Warranty, Exchange Available, Preorder
- **Color Selection** — Unique color option picker (deduplicated)
- **Quantity Selector** — Increment/decrement with stock-aware max
- **Add to Cart** — Inline add-to-cart with visual feedback and cart state update
- **Wholesale Pricing** — Displayed when a minimum quantity threshold is met and user is business-approved
- **Specifications** — Key-value spec table from JSON data
- **Highlight Points** — Bulleted feature highlights
- **Customer Reviews** — Approved reviews with star ratings, text, and images
- **Delivery & Returns Info** — Warranty months, return window, weight display

### Cart (`/cart`)

- Authenticated cart management with item selection (checkboxes) for partial checkout
- Quantity increment/decrement per item
- Remove items with confirmation-less removal
- Real-time subtotal and selected item count
- Per-unit pricing with applied discounts displayed
- Stock snapshot comparison to detect stale inventory
- Checkout button linking to `/checkout` with selected product IDs

### Checkout (`/checkout`)

- **Stripe PaymentElement** integration with `Elements` provider wrapper
- **Fulfillment Method** toggle: Delivery ($10 charge, free above $200) or Showroom Pickup (free)
- **Purchase Mode** toggle: Regular or Business (wholesale pricing for approved accounts)
- **Address Management** — Select from saved addresses or add a new one inline
- **Address Validation** — Zod schema with required fields, optional save checkbox
- **Order Summary** — Table of selected items with prices, subtotal, delivery charge, total
- **Stock Validation** — Pre-checkout stock verification with detailed error reporting (per-product requested vs available)
- **Stripe Payment Intent** lifecycle — Created on validation, confirmed on submit, webhook handles fulfillment
- **Checkout Invoice Download** — PDF invoice generation using `pdf-lib`
- **Success Page** (`/checkout/success`) — Order confirmation with invoice download button

### Wishlist (`/wishlist`)

- Add/remove products from wishlist
- Persisted per user across sessions
- Integrated with product cards (heart icon toggle)
- Zustand store for client-side state with server sync
- Admin can view all user wishlist data

### User Dashboard (`/dashboard`)

- **Overview** — Welcome card with business account status, cart summary, recent orders, quick-action links
- **Orders** (`/dashboard/orders`) — Full order history with status badges, item details, and per-order detail page
- **Order Detail** (`/dashboard/orders/[id]`) — Line items, delivery status, shipping address, payment info
- **Addresses** (`/dashboard/addresses`) — Saved address book with add/edit/delete and default flag
- **Wishlist** (`/dashboard/wishlist`) — Manage saved products with pagination and search
- **Business Account** (`/dashboard/business-account`) — Apply for wholesale account with detailed form (business info, contact, documents), view application status

### Authentication & Account

- **Login/Signup** (`/login`) — NextAuth v5 Credentials provider with JWT sessions
- **Registration** — Name, email, password with bcrypt hashing (cost factor 12)
- **Password Reset** (`/forgot-password`, `/reset-password`) — Email-based reset via SMTP with one-time JWT tokens and SHA-256 token fingerprint storage in MySQL
- **Auth Dialog** — Modal login/signup accessible from any page via `?auth=login` or `?auth=signup` query params
- **Return-to Redirect** — Preserves intended destination across auth flows
- **Disabled Account Handling** — Custom `DisabledAccountError` for blocked users

### Customer Support Pages

- **FAQs** (`/faqs`) — Public FAQ list with admin-managed content
- **About Us** (`/about-us`) — Store information
- **Privacy Policy** (`/privacy-policy`)
- **Terms & Conditions** (`/terms-and-conditions`)

### Live Chat (`LiveChatWidget`)

- **Real-time messaging** — SSE (Server-Sent Events) stream via WebSocket-like hub in `chat-realtime.ts`
- **Conversation Management** — Create conversations from any page (home, product, dashboard, order, account)
- **Typing Indicators** — Per-conversation typing state with expiry
- **Read Receipts** — Track read status per user role (customer/admin)
- **Admin Presence** — Online/offline indicators for admin availability
- **Unread Count** — Badge indicator on the chat widget trigger
- **Offline Queueing** — Messages sent while disconnected are queued and sent on reconnect
- **Conversation History** — Full message history with scroll-to-bottom on new messages
- **Source Tracking** — Each conversation records its origin page (`sourceType` + optional `sourceRef`)

### Newsletter

- **Footer Subscription** — Email-only subscribe form with SMTP confirmation
- **Admin Campaigns** — Send HTML email campaigns to all active subscribers with batch sending (4 at a time), error classification (DNS timeout, SMTP credential, connection), and per-subscriber send/fail tracking

---

## Admin Panel (`/admin`)

All admin pages are role-gated (`requireServerRole(["admin"])`) and redirect non-admins to `/dashboard`.

### Overview Dashboard (`/admin`)

- **Stat Cards** — Total users, total products, cart activity distribution (added/updated/removed), business account status breakdown
- **Quick Links** — Navigate to Products, Categories, Banners, Brands, FAQs, Orders, Revenue, Live Chat, Users, Business Accounts, Reviews, Activity Logs, CDN, Newsletter, Inventory

### Revenue Dashboard (`/admin/revenue`)

- **Time Range Selector** — Today (1d), Last 7 Days, Last 30 Days, Last 90 Days, Last 12 Months
- **Summary Cards** — Total Revenue, Total Orders, Total Units, Average Order Value with growth percentages vs previous period
- **Revenue Chart** — Daily revenue/orders/units bar/line chart across the selected range
- **Breakdowns** — Revenue by purchase mode (regular vs business), orders by status
- **Top Products** — Revenue, units, and ranking for top-performing products

### Products (`/admin/products`)

- **List View** — Paginated table with search, sort, image thumbnails, pricing, stock, active/inactive status toggles
- **Create/Edit (`/admin/products/new`, `/admin/products/[id]`)** — Full product form using `ProductForm` component:
  - Name, slug (auto-generated from name), short description
  - Rich text description via **Tiptap** editor (with highlight, image, link, text-align, underline extensions)
  - Pricing: original, discounted, wholesale, wholesale min quantity
  - Stock quantity
  - Category and brand selectors
  - SKU, model number, color, warranty months, return window, weight
  - Tags and highlight points as tag-style inputs
  - SEO fields: meta title, meta description
  - Boolean flags: featured, new arrival, best seller, top rated, trending, limited stock, free delivery, cash on delivery, EMI available, official warranty, exchange available, preorder
  - Image URLs (CDN-based, validated), specifications JSON
  - Active/inactive toggle

### Categories (`/admin/categories`)

- **List View** — Table with name, slug, icon, image, sort order, header/featured flags, active status
- **Create/Edit (`/admin/categories/new`, `/admin/categories/[id]`)** — Form with name, slug, icon selector, image URL, sort order, header category flag (max 8 enforced), featured flag, active flag
- **Delete Protection** — Foreign key constraint safety with graceful error handling

### Brands (`/admin/brands`)

- **List View** — Table with name, slug, image, description, sort order, featured flag, active status
- **Create/Edit (`/admin/brands/new`, `/admin/brands/[id]`)** — Form with name, slug, image URL, description, sort order, featured flag, active flag

### Banners (`/admin/banners`)

- **List/Edit** — Single-page CRUD with title, desktop image URL, optional click URL, sort order, scheduling window (starts at / ends at), active flag
- **Validation** — CDN URL validation, click URL protocol check, schedule window ordering enforcement

### Orders (`/admin/orders`)

- **List View** — Paginated search/filterable table with order ID, customer, items, total, status, purchase mode, date
- **Status Filter** — pending_payment, paid, processing, shipped, delivered, cancelled, refunded
- **Pagination** — Configurable page size (10, 20, 50, 100) with smart page window
- **Order Detail (`/admin/orders/[id]`)** — Full order view with:
  - Customer info (name, email)
  - Shipping address snapshot
  - Line items with per-unit pricing and totals
  - **Partial Fulfillment** — Admin can mark individual item quantities as delivered via `AdminOrderPartialFulfillment` component
  - **Status Transitions** — Update order status with validation
  - **Refund Processing** — Full Stripe refund with reason and amount

### Refunds (`/admin/refunds`)

- View all processed refunds with order ID, customer, admin, Stripe refund ID, amount, currency, reason, timestamp

### Customers (`/admin/customers`)

- View and manage regular (non-admin) users: name, email, role, active status, account creation date
- Toggle active/inactive status to enable or disable accounts

### Users (`/admin/users`)

- View and manage admin users
- Create new admin users with auto-generated temporary passwords sent via SMTP
- Toggle active/inactive status

### Business Accounts (`/admin/business-accounts`)

- **List** — Paginated table with business name, status, contact info, application date
- **Status Filters** — All, Pending, Approved, Rejected
- **Detail/Review (`/admin/business-accounts/[id]`)** — Full application details including legal info, documents, purchase volume, product categories
- **Approval Workflow** — Admin can approve or reject with notes; status is tied to order wholesale pricing eligibility

### Reviews (`/admin/reviews`)

- Moderate product reviews: view all reviews with product, user, rating, comment, images, status
- Approve or reject reviews with optional admin notes
- Review status affects which reviews are visible on the public product detail page

### FAQs (`/admin/faqs`)

- Full CRUD for FAQ entries: question, answer, sort order, active flag
- Public FAQs (`/api/faqs`) served to the storefront FAQ page

### Live Chat (`/admin/live-chat`)

- **Conversation List** — All conversations with customer info, last message preview, status, unread count, admin assignment
- **Real-time Updates** — SSE-based live updates for new messages, typing, and presence
- **Message History** — Full conversation transcript with sender labels
- **Admin Reply** — Inline message composer with send
- **Conversation Controls** — Close conversation, assign to admin

### Newsletter (`/admin/newsletter`)

- View active subscriber count
- Send email campaigns with subject and HTML body
- Per-batch sending (4 at a time) with per-subscriber result tracking (sent/failed)
- SMTP error classification for diagnostics

### Inventory (`/admin/inventory`)

- View product stock levels across all products
- Manage inventory reservations (time-bounded holds during checkout)

### CDN (`/admin/cdn`)

- **File Dashboard** — Total files, total size, total access count
- **Category Breakdown** — Files grouped by category with size and access stats
- **Top Accessed Files** — Most-requested assets
- **Recent Uploads** — Latest uploads with timestamps
- **Upload Button** — Upload new files to the CDN API

### Activity Logs (`/admin/activity`)

- System-wide CRUD audit trail: timestamp, user, action (create/read/update/delete), resource, route path, IP address
- Automatic logging via `RouteAudit` middleware wrapper for all admin mutating routes
- Searchable and filterable by user, action, resource

### Wishlist (`/admin/wishlist`)

- View all user wishlist entries with user info, product, date added
- Paginated and searchable

---

## API Architecture

### Route Structure

```
/api/auth/register              POST   Register new user
/api/auth/logout                POST   Logout
/api/auth/session               GET    Get current session
/api/auth/password-reset/*      POST   Request/verify/confirm password reset
/api/auth/callback/credentials  POST   NextAuth credentials sign-in

/api/me                         GET    Get current user profile

/api/products                   GET    List public products (paginated, filterable)
/api/products/[slug]            GET    Get product by slug

/api/categories                 GET    List public categories
/api/brands                     GET    List public brands
/api/banners                    GET    List active banners
/api/faqs                       GET    List public FAQs

/api/cart                       GET    Get user cart
/api/cart/add                   POST   Add item to cart
/api/cart/update                PATCH  Update cart item quantity
/api/cart/remove                DELETE Remove item from cart

/api/wishlist                   GET    Get wishlist
/api/wishlist                   POST   Add to wishlist
/api/wishlist/remove            DELETE Remove from wishlist

/api/checkout                   POST   Create payment intent + order
/api/checkout/validate          POST   Pre-checkout validation (stock, pricing)

/api/orders                     GET    List user orders
/api/orders/[id]                GET    Get order detail

/api/chat/conversations         GET    List conversations
/api/chat/conversations         POST   Create conversation
/api/chat/conversations/[id]    GET    Get conversation + messages
/api/chat/conversations/[id]    POST   Send message
/api/chat/stream                GET    SSE stream for real-time events
/api/chat/unread-count          GET    Unread conversation count

/api/newsletter/subscribe       POST   Subscribe email
```

### Admin API

All admin endpoints require authentication + admin role:

```
/api/admin/analytics            GET    Dashboard analytics summary
/api/admin/revenue              GET    Revenue snapshot with time range

/api/admin/products             GET    List all products
/api/admin/products             POST   Create product
/api/admin/products/[id]        PUT    Update product
/api/admin/products/[id]        DELETE Delete product

/api/admin/categories           GET    List all categories
/api/admin/categories           POST   Create category
/api/admin/categories/[id]      PUT    Update category
/api/admin/categories/[id]      DELETE Delete category

/api/admin/brands               GET    List all brands
/api/admin/brands               POST   Create brand
/api/admin/brands/[id]          PUT    Update brand
/api/admin/brands/[id]          DELETE Delete brand

/api/admin/banners              GET    List all banners
/api/admin/banners              POST   Create banner
/api/admin/banners/[id]         PUT    Update banner
/api/admin/banners/[id]         DELETE Delete banner

/api/admin/orders               GET    List all orders (paginated, filterable)
/api/admin/orders/[id]          GET    Get order detail
/api/admin/orders/[id]          PATCH  Update order status
/api/admin/orders/[id]/fulfill  POST   Partial fulfillment
/api/admin/orders/[id]/refund   POST   Process refund

/api/admin/reviews              GET    List all reviews
/api/admin/reviews/[id]         PATCH  Update review status + admin note

/api/admin/faqs                 GET    List all FAQs
/api/admin/faqs                 POST   Create FAQ
/api/admin/faqs/[id]            PUT    Update FAQ
/api/admin/faqs/[id]            DELETE Delete FAQ

/api/admin/users                GET    List admin users
/api/admin/users                POST   Create admin user
/api/admin/users/[id]           PUT    Update admin user status
/api/admin/users/[id]           DELETE Delete admin user

/api/admin/customers            GET    List regular users
/api/admin/customers/[id]       PUT    Update user active status

/api/admin/business-accounts    GET    List applications (paginated, filterable)
/api/admin/business-accounts/[id] GET  Get application detail
/api/admin/business-accounts/[id] PATCH Review application (approve/reject)

/api/admin/live-chat/conversations      GET    List all conversations
/api/admin/live-chat/conversations/[id] GET    Conversation detail + messages
/api/admin/live-chat/conversations/[id] POST   Send admin message
/api/admin/live-chat/conversations/[id] PATCH  Close conversation

/api/admin/newsletter           GET    Get subscriber stats
/api/admin/newsletter/send      POST   Send campaign email

/api/admin/inventory            GET    List all inventory

/api/admin/wishlist             GET    List all wishlist entries

/api/admin/cdn/stats            GET    CDN dashboard stats
/api/admin/cdn/upload           POST   Upload file

/api/admin/activity             GET    List activity log entries
```

---

## Backend Architecture

### Layered Design

```
app/api/*/route.ts         ← HTTP handlers (thin, parse → call service → return)
lib/server/services/       ← Business logic (validation, orchestration, error handling)
lib/server/repositories/   ← SQL data access (parameterized queries via mysql2)
lib/server/core/           ← Foundational (env, db pool, errors, HTTP helpers, validation)
lib/server/auth/           ← Authentication (NextAuth, JWT, RBAC guards, sessions)
lib/server/mail/           ← SMTP email sending + HTML template rendering
lib/server/realtime/       ← WebSocket/SSE hub for real-time chat
lib/server/middleware/     ← Route audit logging wrapper
```

### Authentication Flow

1. User registers via `POST /api/auth/register` → bcrypt hash + `authUid` stored in MySQL
2. User signs in via NextAuth Credentials provider → JWT issued via `next-auth`
3. JWT session cookie (HttpOnly) included on all subsequent requests
4. Server reads session via `getServerSession()` or `readSession()` for API routes
5. RBAC enforced via `requireRole(request, ["admin"])` in admin routes
6. Password reset uses JWT with `jti`, stored as SHA-256 hash in MySQL for one-time use
7. Disabled accounts blocked at sign-in with custom `DisabledAccountError`

### Database

34 sequential SQL migrations cover the full schema:

- **Users** — auth_uid, email, password_hash, role (user/admin), business account FK, active flag
- **Categories** — Flat structure (no parent-child), header/featured flags, icon, image URL
- **Products** — Full metadata: pricing (regular, discounted, wholesale), stock, brand FK, flags (featured, new arrival, best seller, trending, etc.), JSON images, JSON specifications, SKU (unique), model, color, warranty, return window, weight, tags, highlight points, SEO fields, rating stats
- **Carts** — One active cart per user, items with stock snapshots, applied discounts
- **Cart Activity** — Add/update/remove audit log for analytics
- **Orders** — Status lifecycle (pending_payment → paid → processing → shipped → delivered), purchase mode (regular/business), shipping address snapshot, Stripe payment intent ID
- **Order Items** — Per-item pricing, delivered/refunded quantities, wholesale flags
- **Order Payments** — Stripe payment intent and status tracking
- **Order Refunds** — Provider, provider refund ID, amount, reason, admin reference
- **Addresses** — User addresses with label, default flag, full contact info
- **Product Reviews** — Rating, comment, images, moderation status (pending/approved/rejected), admin notes, order verification
- **Wishlist** — User-to-product mapping
- **Banners** — Image URL, click URL, scheduling window, sort order, active flag
- **Brands** — Name, slug, image, description, featured flag, active flag
- **FAQs** — Question, answer, sort order, active flag
- **Business Accounts** — Full business profile + admin review workflow (pending/approved/rejected, notes, reviewer)
- **Live Chat** — Conversations (source tracking, status, typing state), Messages (sender role, read tracking)
- **Inventory Reservations** — Time-bounded holds during checkout with expiry
- **Newsletter Subscribers** — Email subscriptions with active flag
- **System Activity Logs** — CRUD audit trail (user, action, resource, route, IP, timestamp)
- **Password Reset Tokens** — JWT `jti` hash, email, expiry, used flag per user

### Key Backend Patterns

- **Parameterized Queries** — All SQL uses `?` placeholders via `mysql2` for injection safety
- **Connection Pool** — Global singleton pool with retry logic for transient errors (ER_CON_COUNT_ERROR, PROTOCOL_CONNECTION_LOST, ECONNRESET, ETIMEDOUT)
- **Transaction Support** — `withTransaction()` helper for atomic operations (checkout, order creation)
- **Structured Error Handling** — `HttpError` class with status code + error code; `handleRouteError()` converts to JSON responses
- **Input Validation** — Zod schemas on all mutating routes via `parseJsonBody()` and `parseSearchParams()`
- **Security Headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` on all API responses
- **Route Audit** — Automatic `insertSystemActivityLog()` via `RouteAudit` wrapper for admin mutating endpoints
- **Stripe Integration** — Payment intent creation, confirmation, webhook handling, refunds
- **SMTP Email** — Nodemailer with TLS, connection verification, error classification, HTML templates with base layout

---

## Frontend Architecture

### Component Structure

```
components/
├── ui/                     Primitive UI (shadcn-style, Radix-based)
│   ├── avatar.tsx          User avatar
│   ├── badge.tsx           Status badges
│   ├── breadcrumb.tsx      Navigation breadcrumbs
│   ├── button.tsx          Variant-based button system
│   ├── card.tsx            Card container
│   ├── dialog.tsx          Modal dialog (Radix)
│   ├── dropdown-menu.tsx   Dropdown menu (Radix)
│   ├── input.tsx           Text input
│   ├── label.tsx           Form label
│   ├── pagination.tsx      Page navigation
│   ├── rich-text-editor.tsx Tiptap editor wrapper
│   ├── select.tsx          Dropdown select (Radix)
│   ├── separator.tsx       Visual separator
│   ├── sheet.tsx           Slide-over panel (Radix)
│   ├── sonner.tsx          Toast notification (sonner)
│   ├── table.tsx           Data table
│   ├── tabs.tsx            Tab container (Radix)
│   └── textarea.tsx        Multiline text input
├── storefront/             Public-facing components
│   ├── product-scroll-row.tsx  Horizontal product scroller
│   ├── storefront-motion.tsx   GSAP scroll animations
│   └── storefront-skeletons.tsx Loading skeletons
├── admin/                  Admin-specific components
│   ├── admin-overview-dashboard.tsx
│   ├── admin-revenue-dashboard.tsx
│   ├── admin-orders-manager.tsx
│   ├── admin-order-partial-fulfillment.tsx
│   ├── admin-business-account-requests-manager.tsx
│   ├── admin-inventory-manager.tsx
│   ├── admin-live-chat-manager.tsx
│   ├── admin-reviews-manager.tsx
│   ├── admin-user-manager.tsx
│   ├── regular-user-manager.tsx
│   ├── product-form.tsx
│   ├── product-list-manager.tsx
│   ├── category-create-form.tsx / category-edit-form.tsx / category-list-manager.tsx
│   ├── brand-create-form.tsx / brand-edit-form.tsx / brand-list-manager.tsx
│   ├── faq-manager.tsx
│   ├── newsletter-manager.tsx
│   ├── cdn-upload-button.tsx
│   └── admin-error-toast.tsx
├── layout-chrome.tsx       Root layout wrapper (header/footer for public, full-screen for admin/dashboard)
├── site-header.tsx         Responsive header with search, categories dropdown, user menu, cart icon, wishlist
├── site-footer.tsx         Footer with links, social, newsletter subscribe
├── auth-dialog.tsx         Modal login/signup
├── banner-showcase.tsx     Banner carousel
├── product-card.tsx        Product card with add-to-cart, wishlist toggle, badges
├── product-gallery.tsx     Image viewer with mouse zoom
├── product-reviews-section.tsx Review display
├── add-to-cart-inline.tsx  Qty selector + color picker + add button
├── cart-client.tsx         Cart page with selection, quantity, removal
├── checkout-form.tsx       Stripe checkout form with address, fulfillment, purchase mode
├── checkout-page-client.tsx Checkout page wrapper (Stripe Elements)
├── checkout-invoice-download.tsx PDF invoice download
├── order-review-panel.tsx  Order review component
├── dashboard-shell.tsx     Dashboard layout shell
├── address-manager.tsx     Address CRUD component
├── live-chat-widget.tsx    Full live chat widget with SSE, typing, history
├── newsletter-subscribe-form.tsx Email subscription form
├── admin-console.tsx       Admin sidebar navigation
├── category-filters.tsx    Category filter sidebar
└── business-account-application-manager.tsx Business account application form
```

### State Management (Zustand)

| Store | Key State | Persistence |
|---|---|---|
| `auth-store` | token, session, user | localStorage (`gw-auth`) |
| `cart-store` | cart object | localStorage (`gw-cart`) |
| `wishlist-store` | loadedForUserId, productIds, items | In-memory (lazy-loaded per user) |

### Client API Layer

`lib/client/api.ts` is a centralized API client (`apiClient` object) that:
- Handles all fetch calls with `credentials: "include"`
- Injects `Authorization: Bearer <token>` header when provided
- Wraps responses in typed methods with error handling via custom `ApiError` class
- Covers all public, user, admin, chat, newsletter, CDN, and activity endpoints

### Design System

- **Typography** — Inter (body) + Bricolage Grotesque (headlines) via next/font
- **Colors** — Custom accent system (`--accent`), zinc-based neutrals, orange/amber gradients
- **Components** — shadcn/ui style with Radix UI primitives (Dialog, DropdownMenu, Tabs, Slot, Avatar)
- **Animations** — GSAP for scroll-triggered entrances (`storefront-motion.tsx`), CSS transitions for hover states, marquee animation for brand row
- **Icons** — Lucide React + React Icons (Feather set)
- **Responsive** — Mobile-first with Tailwind breakpoints; admin/dashboard pages are full-screen without site chrome
- **Skeletons** — Loading skeleton components for homepage, product listing, and detail pages

---

## Key Integrations

| Integration | Purpose | Implementation |
|---|---|---|
| **Stripe** | Payment processing, refunds | `stripe` SDK + `@stripe/react-stripe-js` + `@stripe/stripe-js`; PaymentIntent lifecycle with webhook-ready design |
| **NextAuth v5** | Authentication | Credentials provider with JWT strategy, callbacks for token/session augmentation |
| **Nodemailer (SMTP)** | Email delivery | Password reset emails, admin welcome emails, newsletter campaigns, order fulfillment notifications; with TLS, connection verification, and error classification |
| **Server-Sent Events** | Real-time chat | Custom SSE hub with in-memory client registry, heartbeat pings, presence tracking, typing indicators |
| **Tiptap** | Rich text editing | StarterKit, Highlight, Image, Link, TextAlign, Underline extensions for product descriptions |
| **GSAP** | Animations | Scroll-triggered entrance animations on storefront sections |
| **pdf-lib + html2pdf.js** | PDF generation | Invoice PDF download from checkout success page |
| **Zod** | Validation | Schema validation on all API inputs (body + search params) and environment variables |
| **mysql2** | Database | Connection pool with retry logic, parameterized queries, transaction support |
| **bcryptjs** | Password hashing | Cost factor 12 for user passwords |
| **jose** | JWT | Password reset token signing and verification |
| **Zustand** | Client state | Auth, cart, and wishlist stores with localStorage persistence |
| **Radix UI** | Headless primitives | Dialog, DropdownMenu, Tabs, Avatar, Slot |

---

## Project Structure

```
gadgetwizard/
├── app/                              Next.js App Router
│   ├── layout.tsx                    Root layout (fonts, chrome, toaster)
│   ├── page.tsx                      Homepage (server-rendered, Suspense-bounded)
│   ├── globals.css                   Tailwind + custom CSS
│   ├── about-us/                     About page
│   ├── admin/                        Admin panel (19 sections)
│   │   ├── page.tsx                  Overview dashboard
│   │   ├── layout.tsx                Admin layout (auth guard + shell)
│   │   ├── products/                 Product CRUD (list, new, edit)
│   │   ├── categories/               Category CRUD (list, new, edit)
│   │   ├── brands/                   Brand CRUD (list, new, edit)
│   │   ├── banners/                  Banner CRUD
│   │   ├── orders/                   Order management (list, detail)
│   │   ├── refunds/                  Refund history
│   │   ├── reviews/                  Review moderation
│   │   ├── faqs/                     FAQ CRUD
│   │   ├── revenue/                  Revenue dashboard
│   │   ├── live-chat/                Real-time chat management
│   │   ├── business-accounts/        Business account approval
│   │   ├── customers/                User management
│   │   ├── users/                    Admin user management
│   │   ├── inventory/                Stock management
│   │   ├── newsletter/               Campaign management
│   │   ├── cdn/                      File asset dashboard
│   │   ├── activity/                 Audit log viewer
│   │   └── wishlist/                 Wishlist viewer
│   ├── api/                          HTTP route handlers (14 resource groups)
│   │   ├── auth/                     Registration, password reset, NextAuth
│   │   ├── products/                 Public product listing + detail
│   │   ├── cart/                     Add/update/remove items
│   │   ├── wishlist/                 Add/remove items
│   │   ├── checkout/                 Validate + create payment intent
│   │   ├── orders/                   User order history
│   │   ├── chat/                     Conversations, messages, SSE stream
│   │   ├── admin/                    Admin CRUD (15 resource groups)
│   │   └── ...                       Banners, brands, categories, faqs, me, newsletter
│   ├── brand/[slug]/                 Brand product listing
│   ├── brands/                       Brand directory
│   ├── category/[slug]/              Category product listing
│   ├── categories/                   Category grid
│   ├── cart/                         Cart page
│   ├── checkout/                     Checkout + success
│   ├── dashboard/                    User dashboard (overview, orders, addresses, wishlist, business-account)
│   ├── login/                        Auth page
│   ├── product/[slug]/               Product detail
│   ├── search/                       Product search
│   ├── wishlist/                     Wishlist page
│   ├── forgot-password/              Password reset request
│   ├── reset-password/               Password reset confirm
│   ├── faqs/                         FAQ page
│   ├── new-arrivals/                 New arrivals listing
│   ├── best-sellers/                 Best sellers listing
│   ├── offers/                       Offers listing
│   └── ...                           Privacy policy, terms, about
├── components/                       React components
│   ├── ui/                           18 primitive components
│   ├── storefront/                   3 components
│   ├── admin/                        22 admin components
│   └── ...                           20+ feature components
├── lib/
│   ├── client/
│   │   ├── api.ts                    Centralized API client (985 lines, covers all endpoints)
│   │   └── types.ts                  TypeScript interfaces (446 lines)
│   ├── server/
│   │   ├── core/                     db.ts, env.ts, errors.ts, http.ts, validation.ts
│   │   ├── auth/                     next-auth.ts, guards.ts, session.ts, jwt.ts, cookie.ts, server-session.ts
│   │   ├── repositories/            21 repository modules
│   │   ├── services/                19 service modules
│   │   ├── mail/                     smtp.ts, templates.ts
│   │   ├── realtime/                 chat-realtime.ts (SSE hub)
│   │   ├── middleware/               route-audit.ts
│   │   ├── types.ts                  Server-side types
│   │   ├── schemas.ts                Zod validation schemas
│   │   └── utils/                    slug, CDN helpers
│   ├── shared/
│   │   ├── checkout.ts               Checkout math (delivery charge, totals, pickup snapshot)
│   │   ├── return-to.ts              Auth redirect URL sanitization
│   │   └── slug.ts                   Slug generation
│   └── stores/                       Zustand stores (auth, cart, wishlist)
├── migrations/                       34 sequential SQL files
├── types/                            next-auth.d.ts
├── public/                           Static assets
├── next.config.ts                    Next.js configuration
├── tailwind.config.ts                Tailwind configuration
├── components.json                   shadcn/ui config
├── tsconfig.json                     TypeScript configuration
├── eslint.config.mjs                 ESLint flat config
└── postcss.config.mjs                PostCSS config
```

---

## Environment Configuration

The application validates all environment variables at startup via Zod (`lib/server/core/env.ts`):

| Variable | Required | Description |
|---|---|---|
| `DB_HOST` | Yes | MySQL host |
| `DB_PORT` | No (default: 3306) | MySQL port |
| `DB_USER` | Yes | MySQL user |
| `DB_PASSWORD` | No (default: "") | MySQL password |
| `DB_NAME` | Yes | MySQL database name |
| `DB_POOL_LIMIT` | No (default: 3) | Connection pool size |
| `AUTH_SECRET` | Yes (min 32 chars) | NextAuth secret |
| `JWT_SECRET` | Yes (min 32 chars) | JWT signing secret |
| `CDN_BASE_URL` | Yes | CDN base URL |
| `CDN_API_BASE_URL` | No | CDN API base URL |
| `CDN_API_KEY` | No | CDN API key |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |
| `SMTP_HOST` | No | SMTP server host |
| `SMTP_PORT` | No (default: 465) | SMTP port |
| `SMTP_USER` / `SMTP_USERNAME` | No | SMTP username |
| `SMTP_PASS` / `SMTP_PASSWORD` | No | SMTP password |
| `SMTP_FROM_EMAIL` | No | Sender email address |
| `SMTP_FROM_NAME` | No (default: "GadgetWizard") | Sender name |
| `APP_BASE_URL` | No | Base URL for links in emails |
| `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES` | No (default: 30) | Token lifetime |

---

## Theme & Design Tokens

- **Accent Color** — `#f36523` (orange) used across buttons, links, gradients, highlights
- **Gradient** — `from-[#f36523] via-orange-400 to-amber-400` for accent text and decorative elements
- **Neutral Palette** — Zinc scale (`zinc-50` through `zinc-900`) for UI surfaces and typography
- **Border Radius** — `rounded-2xl` / `rounded-3xl` for cards and containers; `rounded-full` for pills and badges
- **Shadows** — Subtle `shadow-sm` on cards; none on admin/dashboard to maintain flat aesthetic
- **Fonts** — Inter (body, 400/500/600 weights), Bricolage Grotesque (headlines, 600 weight)
