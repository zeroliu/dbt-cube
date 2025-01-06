with customers as (
    select * from {{ ref('stg_customers') }}
),

final as (
    select
        customer_id,
        name,
        email,
        country,
        created_at
    from customers
)

select * from final
