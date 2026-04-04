# Migration Guide (Phase 1)

These SQL files are ordered and should be executed sequentially.

## Order

1. 001_create_users.sql
2. 002_create_categories.sql
3. 003_create_products.sql
4. 004_create_carts.sql
5. 005_create_cart_activity.sql
6. 006_create_reward_ledger.sql

## Run Migrations Manually

Example using MySQL CLI:

```bash
mysql -u <username> -p <database_name> < migrations/001_create_users.sql
mysql -u <username> -p <database_name> < migrations/002_create_categories.sql
mysql -u <username> -p <database_name> < migrations/003_create_products.sql
mysql -u <username> -p <database_name> < migrations/004_create_carts.sql
mysql -u <username> -p <database_name> < migrations/005_create_cart_activity.sql
mysql -u <username> -p <database_name> < migrations/006_create_reward_ledger.sql
```

## Notes

- MySQL 8+ is recommended for JSON support and CHECK constraint behavior.
- Category hierarchy is self-referencing via categories.parent_id.
- Product images and specifications are stored as JSON for flexible CDN URL arrays and specs.
- Cart design uses one active cart per user for now (no checkout/order yet).
- Cart activity logs support basic admin analytics.
- Reward points ledger is future-ready for purchase integration.
