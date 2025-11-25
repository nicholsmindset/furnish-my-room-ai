# Scheduled Jobs Setup

This document explains how to set up and manage scheduled jobs for the RoomReimagine platform.

## Prerequisites

1. **Enable pg_cron Extension**
   - Go to Supabase Dashboard
   - Navigate to Database > Extensions
   - Search for `pg_cron` and enable it

2. **Enable pg_net Extension** (for HTTP calls)
   - In the same Extensions page
   - Search for `pg_net` and enable it

## Scheduled Jobs Overview

### 1. Monthly Credit Reset

**Schedule:** 1st of every month at 00:00 UTC

**Function:** `reset_monthly_credits()`

**Purpose:** Resets credits for all users based on their subscription tier:
- Free: 3 credits
- Pro: 50 credits
- Business: 999999 credits (effectively unlimited)

### 2. Daily Expiring Subscription Check

**Schedule:** Every day at 09:00 UTC

**Function:** `check_expiring_subscriptions_job()`

**Purpose:** Finds subscriptions expiring within 7 days and sends reminder emails via the `check-expiring-subscriptions` edge function.

## Setup Instructions

### Step 1: Run the Migration

Apply the scheduled jobs migration:

```bash
supabase db push
```

Or manually run the SQL in `supabase/migrations/20251125000000_scheduled_jobs.sql`.

### Step 2: Configure Vault Secrets (for HTTP calls)

For the expiring subscriptions job to call the edge function, you need to set up Vault secrets:

1. Go to Supabase Dashboard > Settings > Vault
2. Add these secrets:
   - `app.supabase_url`: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
   - `app.supabase_anon_key`: Your Supabase anon/public key

Or use SQL:
```sql
ALTER DATABASE postgres SET app.supabase_url TO 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key TO 'your-anon-key';
```

## Managing Jobs

### View All Scheduled Jobs

```sql
SELECT * FROM cron.job;
```

### View Job History

```sql
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### Disable a Job

```sql
SELECT cron.unschedule('job-name');
-- Example: SELECT cron.unschedule('monthly-credit-reset');
```

### Re-enable a Job

```sql
SELECT cron.schedule(
  'monthly-credit-reset',
  '0 0 1 * *',
  $$SELECT public.reset_monthly_credits()$$
);
```

### Run a Job Manually

```sql
-- Run credit reset manually
SELECT public.reset_monthly_credits();

-- Run expiring subscriptions check manually
SELECT public.check_expiring_subscriptions_job();
```

## Cron Schedule Syntax

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

### Examples:
- `0 0 1 * *` - At 00:00 on day 1 of every month
- `0 9 * * *` - At 09:00 every day
- `*/15 * * * *` - Every 15 minutes
- `0 0 * * 0` - At 00:00 every Sunday

## Alternative: External Cron Services

If pg_cron doesn't work for your use case, you can use external services:

### Option 1: Cron-job.org (Free)
1. Go to https://cron-job.org
2. Create jobs that call your edge function URLs:
   - Monthly: `https://your-project.supabase.co/functions/v1/reset-monthly-credits`
   - Daily: `https://your-project.supabase.co/functions/v1/check-expiring-subscriptions`

### Option 2: GitHub Actions
Create `.github/workflows/scheduled-jobs.yml`:

```yaml
name: Scheduled Jobs

on:
  schedule:
    - cron: '0 0 1 * *'  # Monthly credit reset
    - cron: '0 9 * * *'  # Daily expiring subscriptions

jobs:
  run-job:
    runs-on: ubuntu-latest
    steps:
      - name: Call Edge Function
        run: |
          if [ "${{ github.event.schedule }}" = "0 0 1 * *" ]; then
            curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/reset-monthly-credits" \
              -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
          else
            curl -X POST "${{ secrets.SUPABASE_URL }}/functions/v1/check-expiring-subscriptions" \
              -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
          fi
```

## Troubleshooting

### Job Not Running

1. Check if pg_cron is enabled: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
2. Check job status: `SELECT * FROM cron.job WHERE jobname = 'your-job-name';`
3. Check job history: `SELECT * FROM cron.job_run_details WHERE jobid = X ORDER BY start_time DESC;`

### HTTP Calls Failing

1. Check if pg_net is enabled
2. Verify Vault secrets are set correctly
3. Check edge function logs in Supabase Dashboard

### Credits Not Resetting

1. Run manually: `SELECT public.reset_monthly_credits();`
2. Check the function exists: `\df reset_monthly_credits`
3. Verify user_credits table has data
