# Troubleshooting Cron Job Issues

## Issue: 3XX Redirect Responses

If you see **3XX status codes** (redirects) instead of **200 OK** in Vercel analytics, this indicates the requests are being redirected before reaching your API endpoint.

### ✅ **FIXED: Middleware Redirect Issue**

**Root Cause:** The authentication middleware was redirecting unauthenticated requests (like cron jobs) to `/login`, causing 3XX responses.

**Solution:** A root `middleware.ts` file has been created that excludes `/api/push` routes from authentication checks. This allows cron jobs to reach the endpoint directly.

### Common Causes & Solutions

#### 1. **HTTP vs HTTPS Redirect**

**Problem:** The cron job might be calling the endpoint with `http://` instead of `https://`, causing Vercel to redirect to HTTPS.

**Solution:** Ensure the `pillsme_vercel_url` vault secret uses HTTPS:

```sql
-- Check current URL
SELECT name, created_at FROM vault.secrets WHERE name = 'pillsme_vercel_url';

-- Update to HTTPS if needed (replace with your actual URL)
SELECT vault.update_secret(
  'pillsme_vercel_url',
  'https://your-app.vercel.app'  -- Make sure it starts with https://
);
```

#### 2. **Missing CRON_SECRET Environment Variable in Vercel**

**Problem:** If `CRON_SECRET` is not set in Vercel, the endpoint will fail validation and might redirect.

**Solution:**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add `CRON_SECRET` with the same value stored in Supabase Vault (`pillsme_cron_secret`)
4. Make sure it's available for **Production**, **Preview**, and **Development** environments
5. **Redeploy** your application after adding the variable

**To verify in Vercel:**

- Go to: `https://vercel.com/[your-team]/[your-project]/settings/environment-variables`
- Check that `CRON_SECRET` exists and matches the Supabase vault secret

#### 3. **URL Trailing Slash or Path Issues**

**Problem:** The URL might have a trailing slash or incorrect path causing redirects.

**Solution:** Ensure the URL in the vault secret is exactly:

```
https://your-app.vercel.app/api/push/send?action=scheduled
```

Or just the base URL (the query string is added in the cron job):

```
https://your-app.vercel.app
```

#### 4. **Vercel Deployment Not Active**

**Problem:** The deployment might not be active or the URL might be pointing to an old deployment.

**Solution:**

- Check Vercel dashboard to ensure the latest deployment is **Production**
- Verify the URL matches your current production deployment

## How to Debug

### 1. Check Vercel Logs

1. Go to your Vercel project dashboard
2. Click on **Logs** tab
3. Filter for `/api/push/send`
4. Look for:
   - Error messages about missing environment variables
   - Redirect responses
   - Authentication failures

### 2. Test the Endpoint Manually

Test the endpoint with curl to see what's happening:

```bash
# Replace with your actual values
curl -X POST \
  "https://your-app.vercel.app/api/push/send?action=scheduled" \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected response:**

- `200 OK` with JSON body containing notification processing results
- `401 Unauthorized` if CRON_SECRET is wrong
- `3XX` if there's a redirect issue

### 3. Check Supabase Cron Job Execution

```sql
-- Check recent cron job runs
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

### 4. Verify Environment Variables Match

**In Supabase Vault:**

```sql
-- Check the cron secret (you can't decrypt it, but verify it exists)
SELECT name, created_at FROM vault.secrets WHERE name = 'pillsme_cron_secret';
```

**In Vercel:**

- Settings → Environment Variables → Check `CRON_SECRET` exists

**They must match exactly!**

## Quick Fix Checklist

- [ ] `pillsme_vercel_url` in Supabase Vault uses `https://` (not `http://`)
- [ ] `CRON_SECRET` environment variable exists in Vercel
- [ ] `CRON_SECRET` in Vercel matches `pillsme_cron_secret` in Supabase Vault
- [ ] Vercel deployment is active and production-ready
- [ ] URL doesn't have trailing slashes or incorrect paths
- [ ] All environment variables are set for Production environment
- [ ] Application has been redeployed after adding environment variables

## Still Not Working?

1. **Check Vercel Function Logs** for detailed error messages
2. **Verify the cron job is actually running** (check Supabase cron execution history)
3. **Test the endpoint manually** with curl to isolate the issue
4. **Check Vercel Analytics** to see the exact status codes and response times
