# Deployment Guide

## ✅ Completed Steps

### Backend - Supabase ✅
- ✅ Database tables created (10 tables + 2 views)
- ✅ Edge Functions deployed (`track-event`, `assign-experiment`)
- ✅ Environment variables configured

**Supabase Project**: `lcmdworhpdlrwdxbwtye`
**Dashboard**: https://supabase.com/dashboard/project/lcmdworhpdlrwdxbwtye

---

## 🚀 Next: Deploy Frontend to Vercel

### Step 1: Prepare for Deployment

First, create a production `.env` file:

```bash
cd apps/web
cp ../../.env.example .env.local
```

Make sure `.env.local` has these values:
```env
NEXT_PUBLIC_SUPABASE_URL=https://lcmdworhpdlrwdxbwtye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key-from-supabase>
```

### Step 2: Test Locally

```bash
# Install dependencies
npm install

# Run Next.js dev server
cd apps/web
npm run dev
```

Visit: http://localhost:3000

**Test these pages:**
- ✅ `/` - Overview dashboard
- ✅ `/attribution` - Attribution comparison
- ✅ `/experiments` - A/B test results
- ✅ `/funnels` - Conversion funnels
- ✅ `/reconciliation` - Data quality
- ✅ `/demo` - Interactive demo

### Step 3: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository: `ChenemiAbraham/machine-learning`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://lcmdworhpdlrwdxbwtye.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```
5. Click **Deploy**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from apps/web
cd apps/web
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? `juicyway-growth-platform`
- Directory? `./`
- Override build settings? **N**

Add environment variables:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

Then redeploy:
```bash
vercel --prod
```

---

## 📊 Seed Demo Data

Once deployed, seed the database with demo data:

```bash
# Run seed script
cd scripts
npx tsx seed-data.ts
```

This creates:
- 1,000 demo users
- 5,000 events
- 2,000 transactions
- 2 active experiments

---

## 🎯 Post-Deployment Checklist

### Frontend
- [ ] Next.js deployed to Vercel
- [ ] Environment variables configured
- [ ] All 6 pages load without errors
- [ ] Data fetching from Supabase works

### Backend
- [x] Supabase database tables created
- [x] Edge Functions deployed
- [ ] RLS policies enabled (optional, for production)
- [ ] Database indexes optimized

### Demo Data
- [ ] Seed script run successfully
- [ ] Attribution data visible in dashboard
- [ ] Experiments showing results
- [ ] Reconciliation reports generated

### Documentation
- [x] README.md complete
- [x] CASE_STUDY.md written
- [x] ARCHITECTURE.md detailed
- [x] GETTING_STARTED.md created

---

## 🔗 Live URLs (After Deployment)

**Frontend**: `https://juicyway-growth-platform.vercel.app`
**Supabase Dashboard**: https://supabase.com/dashboard/project/lcmdworhpdlrwdxbwtye
**GitHub Repository**: https://github.com/ChenemiAbraham/machine-learning
**Case Study**: https://github.com/ChenemiAbraham/machine-learning/blob/master/docs/CASE_STUDY.md

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**Error**: Module not found
**Solution**: Ensure root `package.json` has all dependencies

```bash
# Install all workspace dependencies
npm install
```

### Data Not Loading

**Error**: Supabase connection timeout
**Solution**: Check environment variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy: Deployments → Click latest → Redeploy

### Edge Functions Not Working

**Error**: 500 Internal Server Error
**Solution**: Check Supabase logs

1. Go to Supabase Dashboard → Edge Functions → Logs
2. Look for errors in recent invocations
3. Verify environment variables in Supabase Settings

---

## 📈 Monitoring (Optional)

### Add Analytics

**Vercel Analytics** (Free):
```bash
npm install @vercel/analytics
```

Add to `apps/web/src/app/layout.tsx`:
```tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Add Error Tracking (Sentry)

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## 💰 Cost Estimate

**Current Setup**:
- Supabase Free Tier: $0/month
- Cloudflare R2 Free Tier: $0/month
- Vercel Hobby: $0/month

**At Scale (100K MAU)**:
- Supabase Pro: $25/month
- Cloudflare R2: ~$10/month (storage + requests)
- Vercel Pro: $20/month

**Total**: $55/month for 100K users = **$0.00055 per user**

---

## ✅ Ready to Share

Once deployed, update your Juicyway application with:

```
Hi Juicyway Team,

I've built and deployed a complete growth engineering platform solving your 
3 technical challenges:

🔗 Live Demo: https://juicyway-growth-platform.vercel.app
🔗 GitHub: https://github.com/ChenemiAbraham/machine-learning
📄 Case Study: https://github.com/ChenemiAbraham/machine-learning/blob/master/docs/CASE_STUDY.md

The platform is fully functional with:
✅ Real-time event tracking
✅ 5 attribution models
✅ Sequential A/B testing
✅ ML predictions (churn, fraud, recommendations)
✅ Data reconciliation monitoring

Tech Stack: Next.js 14, Supabase, DuckDB, Feast, LightGBM
Cost: $0/month (currently) → $55/month at 100K users

Looking forward to discussing how this approach fits Juicyway's needs.

Best,
ChenemiAbraham
```

---

**Status: Backend Deployed ✅ | Frontend: Ready to Deploy 🚀**
