{{
  config(
    materialized='view'
  )
}}

WITH anonymous_sessions AS (
    SELECT DISTINCT
        anonymous_id,
        session_id,
        MIN(server_timestamp) AS session_start,
        MAX(server_timestamp) AS session_end,
        COUNT(*) AS event_count,
        FIRST_VALUE(utm_source) OVER (
            PARTITION BY session_id
            ORDER BY server_timestamp
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS utm_source,
        FIRST_VALUE(utm_medium) OVER (
            PARTITION BY session_id
            ORDER BY server_timestamp
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS utm_medium,
        FIRST_VALUE(utm_campaign) OVER (
            PARTITION BY session_id
            ORDER BY server_timestamp
            ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
        ) AS utm_campaign
    FROM {{ ref('stg_events') }}
    WHERE anonymous_id IS NOT NULL
        AND session_id IS NOT NULL
    GROUP BY anonymous_id, session_id
),

identification_events AS (
    SELECT
        anonymous_id,
        user_id,
        server_timestamp AS identified_at
    FROM {{ ref('stg_events') }}
    WHERE event_name = 'signup_completed'
        AND anonymous_id IS NOT NULL
        AND user_id IS NOT NULL
),

stitched AS (
    SELECT
        s.anonymous_id,
        s.session_id,
        i.user_id,
        s.session_start,
        s.session_end,
        s.event_count,
        s.utm_source,
        s.utm_medium,
        s.utm_campaign,
        i.identified_at,
        CASE
            WHEN i.user_id IS NOT NULL THEN TRUE
            ELSE FALSE
        END AS is_identified
    FROM anonymous_sessions s
    LEFT JOIN identification_events i
        ON s.anonymous_id = i.anonymous_id
        AND s.session_start <= i.identified_at
)

SELECT * FROM stitched
