# Testing Recurring Invoice Cron Job

## Setup on cron-job.org

1. **Create Account**: Go to https://cron-job.org and create a free account

2. **Create New Cron Job**:
   - Click "Create cronjob"
   - **Title**: "Process Recurring Invoices"
   - **Address**: `https://yourdomain.com/api/recurring/process?cron_secret=YOUR_SECRET_HERE`
     - Replace `yourdomain.com` with your actual domain
     - Replace `YOUR_SECRET_HERE` with the value from your `.env.local` file (`CRON_SECRET`)
   - **Schedule**: 
     - For testing: Every 1 minute (`* * * * *`)
     - For production: Every 15 minutes (`*/15 * * * *`)
   - **Request method**: GET or POST (both work)
   - **Save** the cron job

## Testing Locally

### Option 1: Manual API Call
```bash
# Replace YOUR_SECRET with your actual CRON_SECRET from .env.local
curl -X POST "http://localhost:3000/api/recurring/process?cron_secret=YOUR_SECRET"
```

### Option 2: Browser Test
Visit in your browser:
```
http://localhost:3000/api/recurring/process?cron_secret=YOUR_SECRET
```

### Expected Response
```json
{
  "success": true,
  "message": "Processed recurring invoices. Created 0 invoice(s).",
  "invoicesCreated": 0,
  "errors": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing with Real Data

1. **Create a Recurring Invoice**:
   - Go to Invoice Creation page
   - Toggle "Make this a recurring invoice"
   - Set interval (e.g., every 1 month)
   - Set start date to today or in the past
   - Save the invoice

2. **Verify in Database**:
   - Check `recurring_invoices` table in Supabase
   - Verify `status = 'active'`
   - Verify `next_run_at` is set correctly

3. **Trigger Cron Job**:
   - Either wait for the scheduled time, or
   - Manually trigger via API call

4. **Check Results**:
   - Check `invoices` table for new invoice created
   - Check `recurring_invoices` table - `next_run_at` should be updated
   - Check `last_run_at` should be set
   - If `auto_send = true`, check that invoice status is 'sent' and email was sent

## Monitoring

### Check Cron Job Logs
- Go to cron-job.org dashboard
- Click on your cron job
- View "Execution history" to see:
  - Success/failure status
  - Response codes
  - Response times

### Check Application Logs
- Check your application logs for:
  - `Processing due recurring invoices...`
  - `Found X due recurring invoice(s) to process`
  - `Created invoice X from recurring template Y`
  - Any error messages

## Troubleshooting

### Cron Job Returns 401
- Check that `CRON_SECRET` in `.env.local` matches the secret in the cron job URL
- Verify the secret is set correctly in your production environment

### No Invoices Created
- Verify recurring invoice has `status = 'active'`
- Check that `next_run_at <= now()`
- Verify `end_date` hasn't passed (if set)
- Check application logs for errors

### Invoices Created but Not Sent
- Verify `auto_send = true` on the recurring invoice
- Check that client has a valid email address
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for email delivery status

### Cron Job Timing Out
- Check that your server can handle the request within the timeout period
- Consider processing fewer invoices per run if you have many
- Check database query performance

## Production Checklist

- [ ] `CRON_SECRET` is set in production environment
- [ ] Cron job URL uses production domain
- [ ] Schedule is set appropriately (every 15 minutes recommended)
- [ ] Monitoring is set up (logs, alerts)
- [ ] Test with a real recurring invoice before going live

