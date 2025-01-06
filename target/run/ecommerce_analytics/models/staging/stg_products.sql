
    
    create view main."stg_products" as
    with source as (
    select * from raw_products
),

staged as (
    select
        product_id,
        name,
        category,
        price,
        created_at
    from source
)

select * from staged;