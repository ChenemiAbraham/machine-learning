{{
  config(
    materialized='view'
  )
}}

WITH source AS (
    SELECT * FROM postgres_scan(
        'host=localhost port=54322 dbname=postgres user=postgres password=postgres',
        'public',
        'users'
    )
),

cleaned AS (
    SELECT
        id::VARCHAR AS user_id,
        email,
        phone,
        first_name,
        last_name,
        country_code,

        -- KYC
        kyc_status,
        kyc_completed_at::TIMESTAMP,

        -- Attribution
        signup_source,
        signup_utm_source,
        signup_utm_medium,
        signup_utm_campaign,
        signup_utm_content,
        signup_utm_term,

        -- Device
        device_id,
        device_type,
        device_os,
        app_version,

        -- Timestamps
        created_at::TIMESTAMP,
        updated_at::TIMESTAMP,
        deleted_at::TIMESTAMP

    FROM source
    WHERE deleted_at IS NULL
)

SELECT * FROM cleaned
