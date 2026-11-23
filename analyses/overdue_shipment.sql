/*
FINDING: Shipping the order AFTER the seller's own deadline is a small, sharply
              escalating share of the business - 8.9% of delivered orders - and it
              is the part of lateness the business can actually control.
              - Volume: 8,556 / 96,469 delivered orders ship late (8.9%). Median
                overshoot is 1 day, P90 is 7.8 days, so it is mostly a small slip.
              - Dose-response: the late-DELIVERY rate rises monotonically with the
                overshoot - 5.4% (shipped on time) -> 11.6% (<=1 day) -> 17.5%
                (1-3 days) -> 25.6% (3-7 days) -> 59.8% (7 days+).
              - Attribution: of 6,533 late orders, 4,729 (72.4%) were handed to the
                carrier ON TIME and went late in transit; only 1,804 (27.6%) trace
                back to a late handover. Shipping discipline explains about a
                quarter of lateness, not all of it.
              - Distance: the overdue share is flat across distance bands (9.5% ->
                9.2%), so sellers do not systematically under-ship far orders; the
                long routes fail in transit instead (on-time-ship late rate 2.4% ->
                8.2%).
              - Sellers: 75 sellers (>=20 orders) sit above 25% overdue (6,812
                orders) and 233 sit above 10%. The tail is small but nameable.
              - States: overdue 6.7-10.1% everywhere, while late delivery runs 4.0%
                (PR) to 17.4% (MA) - the state spread is a transit problem, not a
                seller problem.
              - Mar 2018 is the clean counter-example: 8.4% overdue (normal) but
                19.0% late, so that spike is pure transit.

RECOMMEND: 1. Measure handover separately from transit - the 72/28 split says most
               lateness will not move if sellers are simply pushed harder.
            2. Alert on overdue-at-handover per order, not only on late delivery,
               so the ~1,800 controllable orders can be escalated the same day.
            3. Work the named seller tail (75 above 25%) with SLA coaching; do not
               touch the 233-strong 10-25% band wholesale.
            4. Fix the long-haul lanes behind the MA/AL/SE late rates and the Mar
               2018 peak before blaming fulfilment.

CAVEAT: Delivered orders that have both a carrier-handover timestamp and a delivery
        estimate (n = 96,469); cancellations and in-flight orders are excluded, as
        are orders with no line items. The shipping deadline is the latest item
        deadline (max shipping_limit_timestamp per order) and overdue hours run
        from it to order_delivered_carrier_timestamp. Late means
        delivery_vs_estimate_days > 0. Distance is the haversine between zip-prefix
        centroids and is null where a zip is missing, so distance cuts drop those
        rows.
*/

-- 1. Headline: how much of the book ships late, and by how much
with
    order_shipping as (
        select
            order_id,
            max(shipping_limit_timestamp) as shipping_limit_ts,
            avg(customer_seller_distance_km) as distance_km
        from {{ ref('fct_order_items') }}
        group by 1
    ),
    base as (
        select
            o.order_id,
            cast(date_trunc('month', o.order_purchase_timestamp) as date) as order_month,
            o.delivery_vs_estimate_days,
            s.distance_km,
            date_diff('hour', s.shipping_limit_ts, o.order_delivered_carrier_timestamp) as overdue_hours
        from {{ ref('fct_orders') }} o
        inner join order_shipping s on o.order_id = s.order_id
        where
            o.order_status = 'delivered'
            and o.order_delivered_carrier_timestamp is not null
            and o.delivery_vs_estimate_days is not null
    )
select
    count(*) as orders,
    count(*) filter (where overdue_hours > 0) as overdue_orders,
    round(100.0 * count(*) filter (where overdue_hours > 0) / count(*), 1) as pct_overdue,
    round(
        median(overdue_hours) filter (where overdue_hours > 0) / 24.0, 1
    ) as overdue_median_days,
    round(
        quantile_cont(overdue_hours, 0.9) filter (where overdue_hours > 0) / 24.0, 1
    ) as overdue_p90_days
from base
;

-- 2. Dose-response: does shipping late actually make the delivery late?
with
    order_shipping as (
        select
            order_id,
            max(shipping_limit_timestamp) as shipping_limit_ts
        from {{ ref('fct_order_items') }}
        group by 1
    ),
    base as (
        select
            o.order_id,
            o.delivery_vs_estimate_days,
            date_diff('hour', s.shipping_limit_ts, o.order_delivered_carrier_timestamp) as overdue_hours
        from {{ ref('fct_orders') }} o
        inner join order_shipping s on o.order_id = s.order_id
        where
            o.order_status = 'delivered'
            and o.order_delivered_carrier_timestamp is not null
            and o.delivery_vs_estimate_days is not null
    )
select
    case
        when overdue_hours <= 0
        then '0 shipped on time'
        when overdue_hours <= 24
        then '1 <=1 day'
        when overdue_hours <= 72
        then '2 1-3 days'
        when overdue_hours <= 168
        then '3 3-7 days'
        else '4 7 days+'
    end as overdue_band,
    count(*) as orders,
    round(100.0 * count(*) / sum(count(*)) over (), 1) as pct_orders,
    round(100.0 * avg(case when delivery_vs_estimate_days > 0 then 1 else 0 end), 1) as pct_late,
    round(
        avg(case when delivery_vs_estimate_days > 0 then delivery_vs_estimate_days end), 1
    ) as avg_late_days
from base
group by 1
order by 1
;

-- 3. Attribution: split late orders into "shipped late" vs "lost in transit",
--    cut by distance band so the two levers are not confused
with
    order_shipping as (
        select
            order_id,
            max(shipping_limit_timestamp) as shipping_limit_ts,
            avg(customer_seller_distance_km) as distance_km
        from {{ ref('fct_order_items') }}
        group by 1
    ),
    base as (
        select
            o.order_id,
            o.delivery_vs_estimate_days,
            s.distance_km,
            date_diff('hour', s.shipping_limit_ts, o.order_delivered_carrier_timestamp) as overdue_hours
        from {{ ref('fct_orders') }} o
        inner join order_shipping s on o.order_id = s.order_id
        where
            o.order_status = 'delivered'
            and o.order_delivered_carrier_timestamp is not null
            and o.delivery_vs_estimate_days is not null
            and s.distance_km is not null
    )
select
    case
        when distance_km < 100
        then '1 <100km'
        when distance_km < 500
        then '2 100-500km'
        when distance_km < 1000
        then '3 500-1000km'
        else '4 1000km+'
    end as distance_band,
    count(*) as orders,
    round(100.0 * avg(case when overdue_hours > 0 then 1 else 0 end), 1) as pct_overdue,
    round(100.0 * avg(case when delivery_vs_estimate_days > 0 then 1 else 0 end), 1) as pct_late,
    round(
        100.0
        * avg(case when delivery_vs_estimate_days > 0 and overdue_hours <= 0 then 1 else 0 end),
        1
    ) as pct_late_shipped_on_time,
    round(
        100.0
        * avg(case when delivery_vs_estimate_days > 0 and overdue_hours > 0 then 1 else 0 end),
        1
    ) as pct_late_shipped_late
from base
group by 1
order by 1
;

-- 4. Sellers: is shipping lateness a small named tail or spread thin?
with
    order_shipping as (
        select order_id, max(shipping_limit_timestamp) as shipping_limit_ts
        from {{ ref('fct_order_items') }}
        group by 1
    ),
    order_seller as (
        select order_id, seller_key from {{ ref('fct_order_items') }} group by 1, 2
    ),
    base as (
        select
            o.order_id,
            date_diff('hour', s.shipping_limit_ts, o.order_delivered_carrier_timestamp) > 0 as is_overdue
        from {{ ref('fct_orders') }} o
        inner join order_shipping s on o.order_id = s.order_id
        where
            o.order_status = 'delivered'
            and o.order_delivered_carrier_timestamp is not null
            and o.delivery_vs_estimate_days is not null
    ),
    seller_stats as (
        select
            sel.seller_key,
            count(*) as orders,
            avg(case when b.is_overdue then 1 else 0 end) as overdue_rate
        from base b
        inner join order_seller sel on b.order_id = sel.order_id
        group by 1
        having count(*) >= 20
    )
select
    case
        when overdue_rate = 0
        then '1 never late'
        when overdue_rate < 0.05
        then '2 <5%'
        when overdue_rate < 0.10
        then '3 5-10%'
        when overdue_rate < 0.25
        then '4 10-25%'
        else '5 25%+'
    end as seller_overdue_band,
    count(*) as sellers,
    sum(orders) as orders
from seller_stats
group by 1
order by 1
;

-- 5. Customer state: overdue (seller-side) vs late (transit-side)
with
    order_shipping as (
        select order_id, max(shipping_limit_timestamp) as shipping_limit_ts
        from {{ ref('fct_order_items') }}
        group by 1
    ),
    base as (
        select
            o.order_id,
            o.customer_key,
            o.delivery_vs_estimate_days,
            date_diff('hour', s.shipping_limit_ts, o.order_delivered_carrier_timestamp) as overdue_hours
        from {{ ref('fct_orders') }} o
        inner join order_shipping s on o.order_id = s.order_id
        where
            o.order_status = 'delivered'
            and o.order_delivered_carrier_timestamp is not null
            and o.delivery_vs_estimate_days is not null
    )
select
    c.customer_state,
    count(*) as orders,
    round(100.0 * avg(case when b.overdue_hours > 0 then 1 else 0 end), 1) as pct_overdue,
    round(100.0 * avg(case when b.delivery_vs_estimate_days > 0 then 1 else 0 end), 1) as pct_late
from base b
inner join {{ ref('dim_customers') }} c on b.customer_key = c.customer_key
group by 1
having count(*) >= 500
order by pct_late desc
;

-- 6. Monthly trend: does the Mar 2018 late spike come from sellers or transit?
with
    order_shipping as (
        select order_id, max(shipping_limit_timestamp) as shipping_limit_ts
        from {{ ref('fct_order_items') }}
        group by 1
    ),
    base as (
        select
            cast(date_trunc('month', o.order_purchase_timestamp) as date) as order_month,
            o.delivery_vs_estimate_days,
            date_diff('hour', s.shipping_limit_ts, o.order_delivered_carrier_timestamp) as overdue_hours
        from {{ ref('fct_orders') }} o
        inner join order_shipping s on o.order_id = s.order_id
        where
            o.order_status = 'delivered'
            and o.order_delivered_carrier_timestamp is not null
            and o.delivery_vs_estimate_days is not null
    )
select
    order_month,
    count(*) as orders,
    round(100.0 * avg(case when overdue_hours > 0 then 1 else 0 end), 1) as pct_overdue,
    round(100.0 * avg(case when delivery_vs_estimate_days > 0 then 1 else 0 end), 1) as pct_late
from base
group by 1
order by 1
;
