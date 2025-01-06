
    
    create view main."stg_orders" as
    with source as (
    select * from raw_orders
),

staged as (
    select
        order_id,
        customer_id,
        product_id,
        quantity,
        order_date,
        status
    from source
)

select * from staged;