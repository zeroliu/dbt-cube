
    
    create view main."stg_customers" as
    with source as (
    select * from raw_customers
),

staged as (
    select
        customer_id,
        name,
        email,
        country,
        created_at
    from source
)

select * from staged;