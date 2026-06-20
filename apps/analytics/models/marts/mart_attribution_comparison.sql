{{
  config(
    materialized='table'
  )
}}

-- This model compares different attribution models side-by-side
-- Implements all 5 attribution models in SQL

WITH user_touchpoints AS (
    SELECT
        ss.user_id,
        ss.session_id,
        ss.session_start AS touchpoint_timestamp,
        ss.utm_source,
        ss.utm_medium,
        ss.utm_campaign,
        u.kyc_completed_at AS conversion_timestamp,
        ROW_NUMBER() OVER (PARTITION BY ss.user_id ORDER BY ss.session_start) AS touchpoint_position,
        COUNT(*) OVER (PARTITION BY ss.user_id) AS total_touchpoints,
        EXTRACT(EPOCH FROM (u.kyc_completed_at - ss.session_start)) / 86400.0 AS days_before_conversion
    FROM {{ ref('int_session_stitching') }} ss
    INNER JOIN {{ ref('stg_users') }} u
        ON ss.user_id = u.user_id
    WHERE ss.user_id IS NOT NULL
        AND u.kyc_status = 'completed'
        AND ss.session_start <= u.kyc_completed_at
),

-- First Touch: 100% to first touchpoint
first_touch AS (
    SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        COUNT(DISTINCT user_id) AS conversions,
        'first_touch' AS model
    FROM user_touchpoints
    WHERE touchpoint_position = 1
    GROUP BY utm_source, utm_medium, utm_campaign
),

-- Last Touch: 100% to last touchpoint
last_touch AS (
    SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        COUNT(DISTINCT user_id) AS conversions,
        'last_touch' AS model
    FROM user_touchpoints
    WHERE touchpoint_position = total_touchpoints
    GROUP BY utm_source, utm_medium, utm_campaign
),

-- Linear: Equal credit to all touchpoints
linear AS (
    SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        SUM(1.0 / total_touchpoints) AS conversions,
        'linear' AS model
    FROM user_touchpoints
    GROUP BY utm_source, utm_medium, utm_campaign
),

-- Time Decay: Exponential decay (half-life = 7 days)
time_decay AS (
    SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        SUM(
            EXP(-0.693 * days_before_conversion / 7.0) /
            SUM(EXP(-0.693 * days_before_conversion / 7.0)) OVER (PARTITION BY user_id)
        ) AS conversions,
        'time_decay' AS model
    FROM user_touchpoints
    GROUP BY utm_source, utm_medium, utm_campaign
),

-- Position Based: 40% first, 40% last, 20% middle
position_based AS (
    SELECT
        utm_source,
        utm_medium,
        utm_campaign,
        SUM(
            CASE
                WHEN total_touchpoints = 1 THEN 1.0
                WHEN total_touchpoints = 2 AND touchpoint_position = 1 THEN 0.5
                WHEN total_touchpoints = 2 AND touchpoint_position = 2 THEN 0.5
                WHEN touchpoint_position = 1 THEN 0.4
                WHEN touchpoint_position = total_touchpoints THEN 0.4
                ELSE 0.2 / (total_touchpoints - 2)
            END
        ) AS conversions,
        'position_based' AS model
    FROM user_touchpoints
    GROUP BY utm_source, utm_medium, utm_campaign
),

-- Union all models
all_models AS (
    SELECT * FROM first_touch
    UNION ALL
    SELECT * FROM last_touch
    UNION ALL
    SELECT * FROM linear
    UNION ALL
    SELECT * FROM time_decay
    UNION ALL
    SELECT * FROM position_based
)

SELECT
    model,
    utm_source,
    utm_medium,
    utm_campaign,
    ROUND(conversions, 2) AS attributed_conversions
FROM all_models
ORDER BY model, attributed_conversions DESC
