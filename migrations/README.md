# Migration Guide (Phase 1)

These SQL files are ordered and should be executed sequentially.

## Order

1. 001_create_users.sql
2. 002_create_categories.sql
3. 003_create_products.sql
4. 004_create_carts.sql
5. 005_create_cart_activity.sql
6. 006_create_reward_ledger.sql
7. 007_create_banners.sql
8. 008_add_category_image_url.sql
9. 009_add_header_category_flag.sql
10. 010_drop_banner_mobile_image.sql
11. 011_seed_dummy_products.sql (optional seed data)
12. 012_create_password_reset_tokens.sql
13. 013_add_brands_and_product_metadata.sql
14. 014_drop_category_parent.sql
15. 015_add_category_featured_flag.sql
16. 016_enforce_unique_product_sku.sql
17. 017_create_faqs.sql
18. 018_create_system_activity_logs.sql
19. 019_migrate_auth_to_nextauth_credentials.sql
20. 020_create_orders.sql
21. 021_create_addresses.sql
22. 022_create_product_reviews.sql
23. 023_create_wishlist_items.sql
24. 024_create_order_payments.sql
25. 025_remove_reward_and_loyalty.sql
26. 026_add_product_wholesale_pricing.sql
27. 027_create_business_accounts.sql
28. 028_add_wholesale_fields_to_orders.sql
29. 029_add_cart_item_stock_snapshot.sql
30. 030_create_live_chat.sql
31. 031_create_newsletter_subscribers.sql

## Run Migrations Manually

Example using MySQL CLI:

```bash
mysql -u <username> -p <database_name> < migrations/001_create_users.sql
mysql -u <username> -p <database_name> < migrations/002_create_categories.sql
mysql -u <username> -p <database_name> < migrations/003_create_products.sql
mysql -u <username> -p <database_name> < migrations/004_create_carts.sql
mysql -u <username> -p <database_name> < migrations/005_create_cart_activity.sql
mysql -u <username> -p <database_name> < migrations/006_create_reward_ledger.sql
mysql -u <username> -p <database_name> < migrations/007_create_banners.sql
mysql -u <username> -p <database_name> < migrations/008_add_category_image_url.sql
mysql -u <username> -p <database_name> < migrations/009_add_header_category_flag.sql
mysql -u <username> -p <database_name> < migrations/010_drop_banner_mobile_image.sql
# Optional demo seed
mysql -u <username> -p <database_name> < migrations/011_seed_dummy_products.sql
mysql -u <username> -p <database_name> < migrations/012_create_password_reset_tokens.sql
mysql -u <username> -p <database_name> < migrations/013_add_brands_and_product_metadata.sql
mysql -u <username> -p <database_name> < migrations/014_drop_category_parent.sql
mysql -u <username> -p <database_name> < migrations/015_add_category_featured_flag.sql
mysql -u <username> -p <database_name> < migrations/016_enforce_unique_product_sku.sql
mysql -u <username> -p <database_name> < migrations/017_create_faqs.sql
mysql -u <username> -p <database_name> < migrations/018_create_system_activity_logs.sql
mysql -u <username> -p <database_name> < migrations/019_migrate_auth_to_nextauth_credentials.sql
mysql -u <username> -p <database_name> < migrations/020_create_orders.sql
mysql -u <username> -p <database_name> < migrations/021_create_addresses.sql
mysql -u <username> -p <database_name> < migrations/022_create_product_reviews.sql
mysql -u <username> -p <database_name> < migrations/023_create_wishlist_items.sql
mysql -u <username> -p <database_name> < migrations/024_create_order_payments.sql
mysql -u <username> -p <database_name> < migrations/025_remove_reward_and_loyalty.sql
mysql -u <username> -p <database_name> < migrations/026_add_product_wholesale_pricing.sql
mysql -u <username> -p <database_name> < migrations/027_create_business_accounts.sql
mysql -u <username> -p <database_name> < migrations/028_add_wholesale_fields_to_orders.sql
mysql -u <username> -p <database_name> < migrations/029_add_cart_item_stock_snapshot.sql
mysql -u <username> -p <database_name> < migrations/030_create_live_chat.sql
mysql -u <username> -p <database_name> < migrations/031_create_newsletter_subscribers.sql
```

## Notes

- MySQL 8+ is recommended for JSON support and CHECK constraint behavior.
- Categories are now flat (no parent-child relationship).
- Product images and specifications are stored as JSON for flexible CDN URL arrays and specs.
- Cart design uses one active cart per user for now (no checkout/order yet).
- Cart activity logs support basic admin analytics.
- Banners use one responsive image source, active windows, and click-through URLs.
- Categories now support optional image_url for richer storefront category cards.
- Categories support is_header_category flag for curated header navigation links.
- 011 is optional and inserts or updates dummy products for development/testing.
- 012 stores one-time password reset token fingerprints for universal user/admin reset flow.
- 013 adds brand management plus production-grade product metadata and pricing fields.
- 014 removes parent category support by dropping categories.parent_id and related constraints/indexes.
- 015 adds is_featured category flag for homepage category highlights.
- 016 enforces a unique SKU constraint for products.
- 017 creates FAQs for public help content and admin management.
- 018 creates system_activity_logs for production-grade CRUD monitoring across API routes.
- 019 migrates authentication from firebase_uid to auth_uid and adds password_hash fields for NextAuth credentials.
- 025 removes legacy reward/loyalty schema (reward points and loyal customer price).
- 026 adds product-level wholesale pricing fields and trigger quantity rules.
- 027 adds business account applications and admin approval workflow data model.
- 028 marks wholesale orders/items and links wholesale orders to approved business accounts.
- 029 stores per-item stock snapshots in carts for stale stock detection at checkout.
- 030 creates real-time chat conversations and messages with read and typing state.
- 031 creates newsletter_subscribers for footer subscriptions and admin newsletter campaigns.
