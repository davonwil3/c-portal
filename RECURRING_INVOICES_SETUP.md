# Recurring Invoices Setup Guide

## Overview

This system allows you to create recurring invoice templates that automatically generate and send invoices on a schedule.

## Database Setup

1. Run the SQL migration to create the `recurring_invoices` table:
   ```bash
   # In your Supabase SQL editor or via migration tool
   # Run: supabase/recurring_invoices_schema.sql
   ```

## Environment Variables

Add the following to your `.env.local` or environment configuration:

```env
# Required: Secret for authenticating cron job requests
CRON_SECRET=your-super-secret-random-string-here

# Required: Your app URL (for generating share links)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# or for local development:
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# Required: Resend API key for sending emails
RESEND_API_KEY=your-resend-api-key

# Optional: Custom from email address
FROM_EMAIL=noreply@yourdomain.com
```

## External Cron Job Setup

Since we're using a free external scheduler (not Vercel Cron), you'll need to set up a cron job service. Here are some free options:

### Option 1: cron-job.org (Recommended - Free)

1. Go to https://cron-job.org and create a free account
2. Create a new cron job:
   - **Title**: Process Recurring Invoices
   - **Address**: `https://yourdomain.com/api/recurring/process?cron_secret=your-super-secret-random-string-here`
   - **Schedule**: Every 15 minutes (or hourly if preferred)
   - **Request method**: GET or POST (both work)
3. Save the cron job

### Option 2: EasyCron (Free tier available)

1. Go to https://www.easycron.com and sign up
2. Create a new cron job with:
   - **URL**: `https://yourdomain.com/api/recurring/process?cron_secret=your-super-secret-random-string-here`
   - **Schedule**: `*/15 * * * *` (every 15 minutes)
3. Save and activate

### Option 3: GitHub Actions (Free for public repos)

Create `.github/workflows/recurring-invoices.yml`:
```yaml
name: Process Recurring Invoices

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Process Recurring Invoices
        run: |
          curl -X POST "https://yourdomain.com/api/recurring/process?cron_secret=${{ secrets.CRON_SECRET }}"
```

## API Endpoint

The processing endpoint is available at:
- **URL**: `/api/recurring/process`
- **Methods**: GET or POST
- **Authentication**: Query parameter `cron_secret` or header `X-Cron-Secret`
- **Response**: JSON with processing results

Example response:
```json
{
  "success": true,
  "message": "Processed recurring invoices. Created 3 invoice(s).",
  "invoicesCreated": 3,
  "errors": [],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage

### Creating a Recurring Invoice Template

Use the `createRecurringInvoice` function from `lib/recurring-invoices.ts`:

```typescript
import { createRecurringInvoice } from '@/lib/recurring-invoices'

const recurringInvoice = await createRecurringInvoice({
  name: "Monthly Retainer",
  client_id: "client-uuid",
  title: "Monthly Retainer - January 2024",
  line_items: [
    {
      id: "1",
      name: "Retainer Services",
      description: "Monthly retainer for consulting services",
      item_type: "service",
      quantity: 1,
      unit_rate: 5000,
      total_amount: 5000,
      is_taxable: true,
      sort_order: 1,
    }
  ],
  subtotal: 5000,
  tax_rate: 0,
  tax_amount: 0,
  discount_type: "percentage",
  discount_amount: 0,
  discount_value: 0,
  total_amount: 5000,
  interval_type: "monthly",
  interval_value: 1,
  start_date: "2024-01-15T00:00:00Z",
  auto_send: true,
  days_until_due: 30,
  email_subject: "Your Monthly Invoice",
  email_body: "Please find your monthly invoice attached.",
})
```

### Interval Types

- **weekly**: Runs every N weeks (interval_value)
- **monthly**: Runs every N months (interval_value)
- **yearly**: Runs every N years (interval_value)
- **custom**: Runs every N days (interval_value)

### Status Values

- **active**: Recurring invoice is active and will generate invoices
- **paused**: Temporarily paused (won't generate invoices)
- **ended**: Permanently ended (won't generate invoices)

## How It Works

1. **Scheduler calls** `/api/recurring/process` every 15 minutes (or your chosen interval)
2. **System finds** all active recurring invoices where `next_run_at <= now()`
3. **For each due template**:
   - Creates a new invoice with the template data
   - If `auto_send = true`: Marks as "sent", generates share link, and emails the client
   - If `auto_send = false`: Marks as "draft" (no email sent)
   - Updates `next_run_at` to the next scheduled date
   - Updates `last_run_at` timestamp
4. **Returns summary** of how many invoices were created

## Testing

You can manually trigger the processing endpoint:

```bash
# Using curl
curl -X POST "http://localhost:3000/api/recurring/process?cron_secret=your-secret"

# Or using the browser (GET request)
# Visit: http://localhost:3000/api/recurring/process?cron_secret=your-secret
```

## Security Notes

- **Never commit** `CRON_SECRET` to version control
- Use a **strong, random secret** (at least 32 characters)
- The endpoint will return 401 if the secret doesn't match
- Consider adding IP whitelisting if your cron service supports it

## Troubleshooting

### Invoices not being created

1. Check that recurring invoices have `status = 'active'`
2. Verify `next_run_at` is in the past
3. Check server logs for errors
4. Ensure the cron job is actually running (check cron service dashboard)

### Emails not being sent

1. Verify `RESEND_API_KEY` is set correctly
2. Check that `auto_send = true` on the recurring invoice
3. Ensure client has a valid email address
4. Check Resend dashboard for email delivery status

### Share links not working

1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check that share tokens are being generated (check database)
3. Ensure the invoice route is accessible

