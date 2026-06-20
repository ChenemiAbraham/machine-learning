{{
  config(
    materialized='view'
  )
}}

WITH source AS (
    SELECT * FROM postgres_scan(
        'host=localhost port=54322 dbname=postgres user=postgres password=postgres',
        'public',
        'transactions'
    )
),

cleaned AS (
    SELECT
        id::VARCHAR AS transaction_id,
        user_id::VARCHAR,
        type AS transaction_type,
        status,
        amount::DECIMAL(19,4),
        currency,
        fee::DECIMAL(19,4),
        exchange_rate::DECIMAL(19,8),
        recipient_id::VARCHAR,
        recipient_name,
        recipient_account,
        reference,
        provider,
        external_reference,

        created_at::TIMESTAMP,
        updated_at::TIMESTAMP,
        completed_at::TIMESTAMP,
        failed_at::TIMESTAMP,
        failure_reason

    FROM source
)

SELECT * FROM cleaned
