{{
  config(
    materialized='view'
  )
}}

WITH first_transactions AS (
    SELECT
        user_id,
        MIN(created_at) AS first_transaction_at,
        MIN_BY(transaction_type, created_at) AS first_transaction_type,
        MIN_BY(amount, created_at) AS first_transaction_amount
    FROM {{ ref('stg_transactions') }}
    WHERE status = 'completed'
    GROUP BY user_id
)

SELECT * FROM first_transactions
