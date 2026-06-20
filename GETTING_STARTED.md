# Getting Started - Juicyway Growth Platform

Welcome! This guide will help you set up and run the Juicyway Growth Platform demo.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://www.python.org/downloads/))
- **Supabase CLI** ([Installation guide](https://supabase.com/docs/guides/cli))
- **Git** (should already be installed)
- **Code Editor** (VS Code recommended)

## 🚀 Quick Start (5 minutes)

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for ML components)
cd apps/ml
pip install -r requirements.txt
cd ../..
```

### Step 2: Start Supabase Locally

```bash
# Initialize and start Supabase
supabase start

# This will output:
# - API URL: http://localhost:54321
# - API Key (anon): eyJ...
# - Service Role Key: eyJ...
# - Database URL: postgresql://...
```

### Step 3: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your Supabase credentials from step 2
# NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Step 4: Run Database Migrations

```bash
# Apply database schema
supabase db push

# Verify tables were created
supabase db diff
```

### Step 5: Seed Demo Data

```bash
# Generate 1,000 users with realistic journeys
npm run seed

# This creates:
# - 1,000 users across 7 African countries
# - 50,000+ events (page views, signups, transactions)
# - 5,000+ transactions
# - 3 active A/B experiments
# - ML feature sets for all users
```

### Step 6: Start Development Servers

```bash
# Terminal 1: Start all services
npm run dev

# This starts:
# - Next.js dashboard (http://localhost:3000)
# - DuckDB analytics server (http://localhost:8001)
# - ML API server (http://localhost:8000)
```

### Step 7: Deploy Supabase Edge Functions

```bash
# Deploy event tracking function
supabase functions deploy track-event

# Deploy experiment assignment function
supabase functions deploy assign-experiment

# Test the functions
curl -X POST http://localhost:54321/functions/v1/track-event \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"event_name":"page_view","anonymous_id":"test-123","properties":{}}'
```

## 🎯 What You've Built

### 1. Event Tracking System
- **Access**: http://localhost:3000/events
- **Try it**: Click around the demo app to generate events
- **View data**: Check Supabase Studio → `events` table

### 2. Attribution Engine
- **Access**: http://localhost:3000/attribution
- **See**: 5 attribution models comparing channel performance
- **Query**: Run attribution models via DuckDB

### 3. Reconciliation Dashboard
- **Access**: http://localhost:3000/reconciliation
- **Purpose**: Monitor data quality between transactional and analytics systems
- **Alert**: Visual indicators when variance > 1%

### 4. Experiment Framework
- **Access**: http://localhost:3000/experiments
- **Active experiments**: 3 running experiments with real-time results
- **Statistical analysis**: Confidence intervals, p-values, variant performance

### 5. ML Features
- **Access**: http://localhost:8000/docs (FastAPI Swagger UI)
- **Endpoints**:
  - `/predict/churn` - Churn prediction
  - `/predict/fraud` - Fraud detection
  - `/recommend/products` - Product recommendations

## 📊 Exploring the Data

### Supabase Studio

```bash
# Open Supabase Studio
supabase studio

# Navigate to:
# - Table Editor: View all tables and data
# - SQL Editor: Run custom queries
# - Database: See schema and relationships
```

### Sample Queries

```sql
-- View funnel conversion rates
SELECT
  get_user_funnel_stage(id) AS stage,
  COUNT(*) AS users
FROM users
GROUP BY stage
ORDER BY
  CASE stage
    WHEN 'signup' THEN 1
    WHEN 'kyc_started' THEN 2
    WHEN 'kyc_complete' THEN 3
    WHEN 'first_transaction' THEN 4
    WHEN 'repeat_user' THEN 5
  END;

-- Attribution by channel (last 30 days)
SELECT
  signup_utm_source AS channel,
  COUNT(*) AS signups,
  COUNT(*) FILTER (WHERE kyc_status = 'completed') AS kyc_completions,
  ROUND(
    COUNT(*) FILTER (WHERE kyc_status = 'completed')::numeric / COUNT(*) * 100,
    2
  ) AS kyc_completion_rate
FROM users
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY signup_utm_source
ORDER BY signups DESC;

-- Experiment results
SELECT
  e.name,
  ea.variant,
  COUNT(DISTINCT ea.user_id) AS users,
  COUNT(DISTINCT t.id) AS transactions,
  ROUND(
    COUNT(DISTINCT t.id)::numeric / COUNT(DISTINCT ea.user_id),
    4
  ) AS conversion_rate
FROM experiments e
JOIN experiment_assignments ea ON e.id = ea.experiment_id
LEFT JOIN transactions t ON ea.user_id = t.user_id
  AND t.created_at >= ea.assigned_at
WHERE e.status = 'running'
GROUP BY e.name, ea.variant;
```

## 🧪 Testing the System

### End-to-End User Journey

```typescript
// Run this in the browser console at http://localhost:3000

// 1. Track anonymous page view
await fetch('/api/events/track', {
  method: 'POST',
  body: JSON.stringify({
    event_name: 'page_view',
    anonymous_id: 'test-user-123',
    properties: { page: '/landing' }
  })
});

// 2. Get experiment assignment
const { variant } = await fetch('/api/experiments/assign/onboarding_v2', {
  method: 'POST',
  body: JSON.stringify({ anonymous_id: 'test-user-123' })
}).then(r => r.json());

console.log('Assigned to variant:', variant);

// 3. Simulate signup
await fetch('/api/events/track', {
  method: 'POST',
  body: JSON.stringify({
    event_name: 'signup_completed',
    anonymous_id: 'test-user-123',
    user_id: 'new-user-uuid',
    properties: { email: 'test@example.com' }
  })
});

// 4. Check ML prediction
const churnScore = await fetch('/ml/predict/churn?user_id=new-user-uuid')
  .then(r => r.json());

console.log('Churn probability:', churnScore.probability);
```

### Load Testing

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/

# Run load test
k6 run tests/load/event-ingestion.js

# Expected results:
# - 50ms p95 latency
# - 0% error rate
# - 1000 req/s throughput
```

## 📦 Project Structure

```
juicyway/
├── apps/
│   ├── web/                 # Next.js dashboard [NEXT TO BUILD]
│   ├── analytics/           # DuckDB + dbt [NEXT TO BUILD]
│   └── ml/                  # ML models + API [NEXT TO BUILD]
├── packages/
│   ├── event-schema/        # ✅ TypeScript event types
│   ├── attribution/         # ⏳ Attribution engine
│   └── experiments/         # ⏳ A/B testing framework
├── supabase/
│   ├── migrations/          # ✅ Database schema
│   └── functions/           # ✅ Edge functions
├── docs/
│   ├── ARCHITECTURE.md      # ✅ System design
│   └── CASE_STUDY.md        # ⏳ 3 challenges solved
└── scripts/
    └── seed-data.ts         # ✅ Demo data generator
```

## 🔧 Troubleshooting

### Supabase won't start

```bash
# Reset Supabase
supabase stop
supabase db reset
supabase start
```

### Port conflicts

```bash
# Check what's using port 54321
lsof -i :54321

# Kill the process
kill -9 <PID>

# Or configure different ports in supabase/config.toml
```

### Seed data fails

```bash
# Check database connection
psql postgresql://postgres:postgres@localhost:54322/postgres

# Manually run migrations
supabase db push

# Clear existing data
supabase db reset
```

### TypeScript errors

```bash
# Rebuild all packages
npm run clean
npm install
npm run build
```

## 🎓 Learning Resources

### Supabase
- [Official Docs](https://supabase.com/docs)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### DuckDB
- [SQL Reference](https://duckdb.org/docs/sql/introduction)
- [Parquet Files](https://duckdb.org/docs/data/parquet)

### Feast
- [Quickstart](https://docs.feast.dev/getting-started/quickstart)
- [Feature Store Concepts](https://docs.feast.dev/getting-started/concepts)

### Growth Engineering
- [Multi-Touch Attribution](https://www.bizible.com/blog/multi-touch-attribution)
- [Experiment Design](https://exp-platform.com/)
- [Statistical Significance](https://www.evanmiller.org/ab-testing/)

## 📞 Need Help?

This is a portfolio project demonstrating growth engineering skills for Juicyway.

**Maintainer**: [Your Name]  
**Email**: your.email@example.com  
**LinkedIn**: linkedin.com/in/yourprofile  

---

**Ready to dive deeper?** Check out:
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - System design deep-dive
- [CASE_STUDY.md](docs/CASE_STUDY.md) - How we solved the 3 challenges
- [API.md](docs/API.md) - API reference

**Next: Build the Next.js dashboard** 🚀
