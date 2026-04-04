-- 011_seed_dummy_products.sql
-- Optional development seed for dummy products.
-- Uses category slugs and can be re-run safely.

INSERT INTO products (
    name,
    slug,
    description,
    price,
    discounted_price,
    stock,
    category_id,
    images,
    specifications,
    is_active
)
SELECT
    seed.name,
    seed.slug,
    seed.description,
    seed.price,
    seed.discounted_price,
    seed.stock,
    category.id,
    JSON_ARRAY('/9aa1eac1-0fc2-4e2f-9723-44d8eaf5c8e2') AS images,
    seed.specifications,
    1 AS is_active
FROM (
    SELECT
        'iPhone 15 Pro Demo' AS name,
        'iphone-15-pro-demo' AS slug,
        '<p>Dummy demo product for storefront testing.</p>' AS description,
        179999.00 AS price,
        169999.00 AS discounted_price,
        15 AS stock,
        'phones' AS category_slug,
        JSON_OBJECT('General', JSON_OBJECT('Model', 'iPhone 15 Pro', 'Storage', '256GB')) AS specifications

    UNION ALL

    SELECT
        'iPhone 15 Plus Demo',
        'iphone-15-plus-demo',
        '<p>Dummy demo product for storefront testing.</p>',
        149999.00,
        142999.00,
        20,
        'phones',
        JSON_OBJECT('General', JSON_OBJECT('Model', 'iPhone 15 Plus', 'Storage', '128GB'))

    UNION ALL

    SELECT
        'MacBook Air M2 Demo',
        'macbook-air-m2-demo',
        '<p>Dummy demo product for storefront testing.</p>',
        154999.00,
        149999.00,
        12,
        'apple-products',
        JSON_OBJECT('Performance', JSON_OBJECT('Chip', 'Apple M2', 'RAM', '8GB'))

    UNION ALL

    SELECT
        'Apple Watch Series 9 Demo',
        'apple-watch-series-9-demo',
        '<p>Dummy demo product for storefront testing.</p>',
        51999.00,
        48999.00,
        30,
        'gadget-accessories',
        JSON_OBJECT('Wearable', JSON_OBJECT('Case', '45mm', 'Connectivity', 'GPS'))

    UNION ALL

    SELECT
        'iPad Air Demo',
        'ipad-air-demo',
        '<p>Dummy demo product for storefront testing.</p>',
        89999.00,
        85999.00,
        18,
        'tablets-and-accessories',
        JSON_OBJECT('Tablet', JSON_OBJECT('Display', '10.9-inch', 'Storage', '64GB'))

    UNION ALL

    SELECT
        'AirPods Pro Demo',
        'airpods-pro-demo',
        '<p>Dummy demo product for storefront testing.</p>',
        32999.00,
        30999.00,
        40,
        'gadget-accessories',
        JSON_OBJECT('Audio', JSON_OBJECT('Type', 'TWS', 'ANC', 'Yes'))
) AS seed
INNER JOIN categories AS category
    ON category.slug = seed.category_slug
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    description = VALUES(description),
    price = VALUES(price),
    discounted_price = VALUES(discounted_price),
    stock = VALUES(stock),
    category_id = VALUES(category_id),
    images = VALUES(images),
    specifications = VALUES(specifications),
    is_active = VALUES(is_active),
    updated_at = CURRENT_TIMESTAMP;
