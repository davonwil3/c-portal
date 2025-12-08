# Stripe Integration Setup Guide

This guide will help you set up Stripe for testing payments in your application.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard

## Step 1: Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Publishable key** (starts with `pk_test_`)
3. Copy your **Secret key** (starts with `sk_test_`)
4. Add these to your `.env.local` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

## Step 2: Create Products and Prices in Stripe

1. Go to https://dashboard.stripe.com/test/products
2. Click **"Add product"**

### Create Pro Plan:
- **Name**: Pro Plan
- **Description**: Best for growing freelancers
- **Pricing**: 
  - **Price**: $25.00
  - **Billing period**: Monthly (recurring)
- Click **"Save product"**
- Copy the **Price ID** (starts with `price_`)

### Create Premium Plan:
- **Name**: Premium Plan
- **Description**: For freelancers ready to grow into a brand
- **Pricing**: 
  - **Price**: $39.00
  - **Billing period**: Monthly (recurring)
- Click **"Save product"**
- Copy the **Price ID** (starts with `price_`)

3. Add the Price IDs to your `.env.local` file:

```env
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_PREMIUM_PRICE_ID=price_your_premium_price_id_here
```

## Step 3: Webhook Setup (Optional)

**Note:** Webhooks are optional! The app will automatically verify subscriptions after checkout and sync status when users visit the billing page.

If you want real-time updates (recommended for production), you can set up webhooks:

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **"Add endpoint"**
3. Enter your webhook URL: `https://your-domain.com/api/stripe/webhook`
   - For local testing, use a tool like [Stripe CLI](https://stripe.com/docs/stripe-cli) or [ngrok](https://ngrok.com)
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook signing secret** (starts with `whsec_`)
6. Add it to your `.env.local` file (optional):

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Local Testing with Stripe CLI

If you want to test webhooks locally:

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Copy the webhook signing secret from the output and add it to `.env.local`

## Step 4: Test Cards

Stripe provides test card numbers for testing:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

Use any future expiry date (e.g., 12/25) and any 3-digit CVC.

## Step 5: Environment Variables Summary

Add these to your `.env.local` file (webhook secret is optional):

```env
# Stripe Keys (Required)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (Required)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Stripe Connect (Required for invoice payments)
STRIPE_CLIENT_ID=ca_...  # Get this from https://dashboard.stripe.com/settings/applications/overview

# Webhook Secret (Optional - only needed if using webhooks)
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing the Integration

1. Start your development server: `npm run dev`
2. Go to Settings > Billing
3. Click "Upgrade Plan"
4. Select a plan (Pro or Premium)
5. Use test card `4242 4242 4242 4242` with any future expiry date
6. Complete the checkout
7. You should be redirected back and see your plan updated

## Step 6: Enable Apple Pay & Google Pay (Optional)

Apple Pay and Google Pay are **automatically available** in Stripe Checkout - you don't need to add them to the code. They appear automatically when:

### For Production:

1. **Domain Verification**:
   - Go to https://dashboard.stripe.com/settings/payment_methods
   - Scroll to "Apple Pay" section
   - Click "Add domain" and enter your production domain
   - Download the verification file and host it at `/.well-known/apple-developer-merchantid-domain-association`
   - Or use Stripe's automatic verification if supported

2. **Google Pay**:
   - Automatically enabled when you add your domain
   - No additional setup required

### How It Works:

- Stripe Checkout automatically detects supported payment methods based on:
  - User's device/browser (iPhone, iPad, Mac for Apple Pay; Android/Chrome for Google Pay)
  - Domain verification status
  - Payment method availability in the user's region
- No code changes needed - they appear automatically in the checkout UI
- Users will see Apple Pay/Google Pay buttons if their device supports it

### For Local Development:

- Apple Pay and Google Pay won't work on `localhost`
- They will automatically appear in production once your domain is verified
- You can test with regular card payments in development

## Important Notes

- All transactions in test mode use fake money
- Test mode keys start with `pk_test_` and `sk_test_`
- When ready for production, switch to live mode keys (start with `pk_live_` and `sk_live_`)
- Make sure to update your webhook endpoint URL for production
- Apple Pay and Google Pay are included in checkout but require domain verification for production

## How It Works Without Webhooks

The app uses a **session verification** approach instead of webhooks:

1. **After Checkout**: When a user completes checkout, Stripe redirects back with a session ID
2. **Immediate Verification**: The app verifies the checkout session and updates the subscription status
3. **Status Sync**: When users visit the billing page, the app syncs subscription status from Stripe

This means:
- ✅ No webhook setup required
- ✅ Works immediately after checkout
- ✅ Status syncs when users visit billing page
- ⚠️ Real-time updates (like cancellations) require a page refresh or webhook setup

## Troubleshooting

- **"Price ID not set" error**: Make sure you've created the products in Stripe and added the Price IDs to `.env.local`
- **Subscription not updating**: Try refreshing the billing page - it will sync status from Stripe
- **Checkout not redirecting**: Verify `NEXT_PUBLIC_APP_URL` is set correctly
- **Webhook not working** (if using): Check that your webhook secret is correct and the endpoint is accessible

