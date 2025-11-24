# Supabase Cron Jobs

This folder contains documentation and SQL scripts for managing Supabase cron jobs used by PillsMe.

## Overview

PillsMe uses Supabase Cron (`pg_cron` + `pg_net`) to schedule server-side push notifications. The cron jobs call Vercel API endpoints that process per-user timezone-aware notifications.

## Prerequisites

Before setting up cron jobs, ensure:

1. **Extensions are enabled:**

   - `pg_cron` - For scheduling recurring jobs
   - `pg_net` - For making HTTP requests
   - `vault` - For storing secrets securely

2. **Vault secrets are configured:**
   - `pillsme_vercel_url` - Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - `pillsme_cron_secret` - A secure random string used to authenticate cron requests

## Current Cron Jobs

### 1. `pillsme-send-reminders`

**Purpose:** Sends supplement reminder notifications to users based on their local timezone.

**Schedule:** Every hour (`0 * * * *`)

**Endpoint:** `GET /api/push/send?action=scheduled`

**How it works:**

- Runs every hour at minute 0 in UTC (e.g., 8:00, 9:00, 10:00, etc.)
- Fetches all users with notifications enabled
- For each user, checks their local timezone
- Determines if current time matches any notification window:
  - **MORNING**: 8:00 AM local time
  - **LUNCH**: 12:00 PM local time
  - **DINNER**: 6:00 PM local time
  - **BEFORE_SLEEP**: 10:00 PM local time
- Sends aggregated notifications for untaken supplements

**Notification Windows:**

- Each time window has a 15-minute grace period
- Notifications are only sent if supplements haven't been taken yet today

## Setup Instructions

### 1. Create Vault Secrets

```sql
-- Store your Vercel URL
SELECT vault.create_secret(
  'https://your-app.vercel.app',  -- Replace with your actual Vercel URL
  'pillsme_vercel_url',
  'Vercel deployment URL for PillsMe API endpoints'
);

-- Store your cron secret (generate with: openssl rand -base64 32)
SELECT vault.create_secret(
  'your-secure-random-string-here',  -- Replace with your actual secret
  'pillsme_cron_secret',
  'Secret key for authenticating cron job requests'
);
```

### 2. Create the Cron Job

Run the SQL script in `setup_reminders_cron.sql`:

```bash
# Or execute directly in Supabase SQL Editor
```

See `setup_reminders_cron.sql` for the complete setup script.

## Monitoring

### Check Cron Job Status

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  created_at,
  updated_at
FROM cron.job
WHERE jobname = 'pillsme-send-reminders';
```

### View Execution History

```sql
SELECT
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'pillsme-send-reminders')
ORDER BY start_time DESC
LIMIT 10;
```

### Check for Failures

```sql
SELECT
  runid,
  status,
  return_message,
  start_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'pillsme-send-reminders')
  AND status = 'failed'
ORDER BY start_time DESC;
```

## Troubleshooting

### Cron Job Not Running

1. **Check if extensions are enabled:**

   ```sql
   SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net', 'vault');
   ```

2. **Verify vault secrets exist:**

   ```sql
   SELECT name, created_at FROM vault.secrets
   WHERE name IN ('pillsme_vercel_url', 'pillsme_cron_secret');
   ```

3. **Check cron job is active:**
   ```sql
   SELECT jobname, active FROM cron.job WHERE jobname = 'pillsme-send-reminders';
   ```

### Common Errors

**Error: `function vault.get_secret(unknown) does not exist`**

- **Solution:** Use `vault.decrypted_secrets` view instead. See `setup_reminders_cron.sql` for correct syntax.

**Error: `Unauthorized cron request`**

- **Solution:** Verify `CRON_SECRET` environment variable in Vercel matches the vault secret.

**Error: `Failed to fetch enabled users`**

- **Solution:** Check database connection and RLS policies on `notification_preferences` table.

## Updating the Schedule

To change the cron schedule (e.g., from 30 minutes to 15 minutes):

1. Unschedule the existing job:

   ```sql
   SELECT cron.unschedule(
     (SELECT jobid FROM cron.job WHERE jobname = 'pillsme-send-reminders')
   );
   ```

2. Recreate with new schedule:
   ```sql
   -- See setup_reminders_cron.sql and update the schedule parameter
   ```

## Files

- `setup_reminders_cron.sql` - SQL script to create the reminder cron job
- `README.md` - This file
