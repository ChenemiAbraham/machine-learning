"""
Cloudflare R2 Event Exporter

Exports events from Postgres to R2 as Parquet files
Partitioned by date for efficient querying with DuckDB
"""

import os
import boto3
from datetime import datetime, timedelta
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from dotenv import load_dotenv
import psycopg2
from typing import Optional

load_dotenv()

# R2 Configuration (S3-compatible)
R2_ENDPOINT = os.getenv('CLOUDFLARE_R2_BOOKOVIA_HOPSWORKS_BUCKET_S3_URL')
R2_BUCKET = os.getenv('CLOUDFLARE_R2_BUCKET_NAME', 'bookovia-hopsworks')
R2_ACCESS_KEY = os.getenv('AWS_ACCESS_KEY_ID')  # Add to .env
R2_SECRET_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')  # Add to .env
R2_REGION = os.getenv('CLOUDFLARE_R2_REGION', 'ENAM')

# Postgres Configuration
PG_HOST = os.getenv('PG_HOST', 'localhost')
PG_PORT = os.getenv('PG_PORT', '54322')
PG_DB = os.getenv('PG_DB', 'postgres')
PG_USER = os.getenv('PG_USER', 'postgres')
PG_PASSWORD = os.getenv('PG_PASSWORD', 'postgres')


class R2EventExporter:
    """Export events to R2 in Parquet format"""

    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY,
            aws_secret_access_key=R2_SECRET_KEY,
            region_name=R2_REGION
        )

        self.pg_conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            dbname=PG_DB,
            user=PG_USER,
            password=PG_PASSWORD
        )

    def export_events_for_date(self, date: datetime) -> str:
        """
        Export events for a specific date to R2

        Args:
            date: Date to export events for

        Returns:
            S3 key where data was written
        """
        date_str = date.strftime('%Y-%m-%d')
        print(f"Exporting events for {date_str}...")

        query = """
            SELECT
                id,
                event_name,
                user_id,
                anonymous_id,
                session_id,
                device_id,
                properties,
                utm_source,
                utm_medium,
                utm_campaign,
                utm_content,
                utm_term,
                referrer,
                device_type,
                device_os,
                device_model,
                app_version,
                browser,
                browser_version,
                ip_address,
                country,
                city,
                experiment_id,
                experiment_variant,
                client_timestamp,
                server_timestamp,
                event_version,
                sdk_version,
                created_at
            FROM events
            WHERE DATE(created_at) = %s
            ORDER BY created_at
        """

        df = pd.read_sql_query(query, self.pg_conn, params=(date_str,))

        if df.empty:
            print(f"No events found for {date_str}")
            return None

        print(f"Found {len(df)} events for {date_str}")

        year = date.strftime('%Y')
        month = date.strftime('%m')
        day = date.strftime('%d')

        s3_key = f"events/year={year}/month={month}/day={day}/events_{date_str}.parquet"

        table = pa.Table.from_pandas(df)

        buffer = pa.BufferOutputStream()
        pq.write_table(
            table,
            buffer,
            compression='snappy',
            use_dictionary=True,
            write_statistics=True
        )

        self.s3_client.put_object(
            Bucket=R2_BUCKET,
            Key=s3_key,
            Body=buffer.getvalue().to_pybytes(),
            ContentType='application/octet-stream'
        )

        print(f"✓ Exported to s3://{R2_BUCKET}/{s3_key}")
        return s3_key

    def export_date_range(self, start_date: datetime, end_date: datetime):
        """Export events for a date range"""
        current = start_date
        while current <= end_date:
            try:
                self.export_events_for_date(current)
            except Exception as e:
                print(f"✗ Error exporting {current}: {e}")

            current += timedelta(days=1)

    def export_all_historical(self):
        """Export all historical events"""
        query = "SELECT MIN(DATE(created_at)) AS min_date, MAX(DATE(created_at)) AS max_date FROM events"
        cursor = self.pg_conn.cursor()
        cursor.execute(query)
        result = cursor.fetchone()

        if result and result[0] and result[1]:
            min_date = result[0]
            max_date = result[1]
            print(f"Exporting events from {min_date} to {max_date}")
            self.export_date_range(min_date, max_date)
        else:
            print("No events found in database")

    def close(self):
        """Close connections"""
        if self.pg_conn:
            self.pg_conn.close()


def main():
    """Main export function"""
    print("Starting R2 event export...")

    exporter = R2EventExporter()

    yesterday = datetime.now() - timedelta(days=1)
    exporter.export_events_for_date(yesterday)

    exporter.close()

    print("\n✓ Export complete!")


if __name__ == '__main__':
    main()
