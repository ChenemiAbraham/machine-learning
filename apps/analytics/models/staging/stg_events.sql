{{
  config(
    materialized='view'
  )
}}

WITH source AS (
    SELECT * FROM postgres_scan(
        'host=localhost port=54322 dbname=postgres user=postgres password=postgres',
        'public',
        'events'
    )
),

cleaned AS (
    SELECT
        id::VARCHAR AS event_id,
        event_name,
        user_id::VARCHAR,
        anonymous_id,
        session_id,
        device_id,

        -- UTM parameters
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        referrer,

        -- Device context
        device_type,
        device_os,
        device_model,
        app_version,
        browser,
        browser_version,

        -- Location
        ip_address::VARCHAR,
        country,
        city,

        -- Experiment
        experiment_id::VARCHAR,
        experiment_variant,

        -- Timestamps
        client_timestamp::TIMESTAMP,
        server_timestamp::TIMESTAMP,
        created_at::TIMESTAMP,

        -- Properties as JSON
        properties::JSON AS properties

    FROM source
)

SELECT * FROM cleaned
