-- Delivery risk mart: one row per purchase month x customer state x distance band.
-- Separates the two levers behind a late delivery: the seller-side one (shipped
-- after its own deadline) and the transit-side remainder. Aggregating it once here
-- keeps the Power BI page and the overdue_shipment analysis on the same numbers.
with
    order_shipping as (
        select
            order_id,
            max(shipping_limit_timestamp) as shipping_limit_ts,
            avg(customer_seller_distance_km) as distance_km
        from {{ ref('fct_order_items') }}
        group by 1
    ),
    orders as (
        select
            order_id,
            customer_key,
            order_status,
            order_purchase_timestamp,
            order_delivered_carrier_timestamp,
            delivery_vs_estimate_days
        from {{ ref('fct_orders') }}
    ),
    customers as (select customer_key, customer_state from {{ ref('dim_customers') }}),
    base as (
        select
            cast(date_trunc('month', o.order_purchase_timestamp) as date) as order_month,
            c.customer_state,
            case
                when s.distance_km < 100
                then '1 <100km'
                when s.distance_km < 500
                then '2 100-500km'
                when s.distance_km < 1000
                then '3 500-1000km'
                when s.distance_km >= 1000
                then '4 1000km+'
                else '5 unknown'
            end as distance_band,
            date_diff(
                'hour', s.shipping_limit_ts, o.order_delivered_carrier_timestamp
            ) as overdue_hours,
            o.delivery_vs_estimate_days
        from orders o
        inner join order_shipping s on o.order_id = s.order_id
        left join customers c on o.customer_key = c.customer_key
        where
            o.order_status = 'delivered'
            and o.order_delivered_carrier_timestamp is not null
            and o.delivery_vs_estimate_days is not null
    ),
    final as (
        select
            order_month,
            customer_state,
            distance_band,
            count(*) as orders,
            count(*) filter (where overdue_hours > 0) as overdue_orders,
            count(*) filter (where delivery_vs_estimate_days > 0) as late_orders,
            round(count(*) filter (where overdue_hours > 0) / count(*), 4) as pct_overdue,
            round(
                count(*) filter (where delivery_vs_estimate_days > 0) / count(*), 4
            ) as pct_late,
            round(avg(case when overdue_hours > 0 then overdue_hours end), 1) as avg_overdue_hours
        from base
        group by 1, 2, 3
    )
select *
from final
