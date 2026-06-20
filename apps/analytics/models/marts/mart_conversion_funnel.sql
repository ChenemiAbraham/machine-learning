{{
  config(
    materialized='table'
  )
}}

WITH user_journey AS (
    SELECT
        u.user_id,
        u.created_at AS signup_at,
        u.kyc_status,
        u.kyc_completed_at,
        ft.first_transaction_at,

        -- Funnel stages
        TRUE AS reached_signup,
        CASE WHEN u.kyc_status IN ('in_progress', 'completed') THEN TRUE ELSE FALSE END AS reached_kyc_start,
        CASE WHEN u.kyc_status = 'completed' THEN TRUE ELSE FALSE END AS reached_kyc_complete,
        CASE WHEN ft.first_transaction_at IS NOT NULL THEN TRUE ELSE FALSE END AS reached_first_transaction,
        CASE WHEN t.repeat_user THEN TRUE ELSE FALSE END AS reached_repeat_transaction,

        -- Time to convert
        CASE
            WHEN u.kyc_completed_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (u.kyc_completed_at - u.created_at)) / 3600.0
        END AS hours_to_kyc,

        CASE
            WHEN ft.first_transaction_at IS NOT NULL
            THEN EXTRACT(EPOCH FROM (ft.first_transaction_at - u.created_at)) / 3600.0
        END AS hours_to_first_transaction

    FROM {{ ref('stg_users') }} u
    LEFT JOIN {{ ref('int_user_first_transaction') }} ft
        ON u.user_id = ft.user_id
    LEFT JOIN (
        SELECT
            user_id,
            COUNT(*) > 1 AS repeat_user
        FROM {{ ref('stg_transactions') }}
        WHERE status = 'completed'
        GROUP BY user_id
    ) t ON u.user_id = t.user_id
),

funnel_summary AS (
    SELECT
        COUNT(*) AS total_signups,
        SUM(CASE WHEN reached_kyc_start THEN 1 ELSE 0 END) AS kyc_started,
        SUM(CASE WHEN reached_kyc_complete THEN 1 ELSE 0 END) AS kyc_completed,
        SUM(CASE WHEN reached_first_transaction THEN 1 ELSE 0 END) AS first_transaction,
        SUM(CASE WHEN reached_repeat_transaction THEN 1 ELSE 0 END) AS repeat_transaction,

        -- Conversion rates
        ROUND(SUM(CASE WHEN reached_kyc_start THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) AS kyc_start_rate,
        ROUND(SUM(CASE WHEN reached_kyc_complete THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) AS kyc_completion_rate,
        ROUND(SUM(CASE WHEN reached_first_transaction THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100, 2) AS activation_rate,
        ROUND(SUM(CASE WHEN reached_repeat_transaction THEN 1 ELSE 0 END)::DECIMAL / NULLIF(SUM(CASE WHEN reached_first_transaction THEN 1 ELSE 0 END), 0) * 100, 2) AS repeat_rate,

        -- Average times
        ROUND(AVG(hours_to_kyc), 2) AS avg_hours_to_kyc,
        ROUND(AVG(hours_to_first_transaction), 2) AS avg_hours_to_first_transaction

    FROM user_journey
)

SELECT * FROM funnel_summary
