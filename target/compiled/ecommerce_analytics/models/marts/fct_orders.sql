with orders as (
    select * from main."stg_orders"
),

products as (
    select * from main."stg_products"
),

final as (
    select
        orders.order_id,
        orders.customer_id,
        orders.product_id,
        orders.quantity,
        orders.order_date,
        orders.status,
        products.price as unit_price,
        orders.quantity * products.price as total_amount
    from orders
    left join products on orders.product_id = products.product_id
)

select * from final