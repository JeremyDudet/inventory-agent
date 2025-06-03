# Stripe Integration Setup

## Required Environment Variables

Add these environment variables to your `.env` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_SUCCESS_URL=http://localhost:3000/subscription/success
STRIPE_CANCEL_URL=http://localhost:3000/pricing
```

## Setup Steps

### 1. Create Stripe Account

1. Go to [https://stripe.com](https://stripe.com)
2. Create an account or log in
3. Navigate to the Dashboard

### 2. Get API Keys

1. In Stripe Dashboard, go to **Developers** > **API keys**
2. Copy your **Publishable key** and **Secret key**
3. Use the test keys for development (they start with `pk_test_` and `sk_test_`)

### 3. Create Products and Prices

1. Go to **Products** in Stripe Dashboard
2. Create your subscription products (e.g., "Basic Plan", "Pro Plan")
3. For each product, create recurring prices
4. Note down the Price IDs (they start with `price_`)

### 4. Set Up Webhooks

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/subscriptions/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Copy the webhook signing secret

### 5. Database Migration

Run the database migration to create subscription tables:

```bash
cd backend
npm run db:generate
npm run db:migrate
```

### 6. Seed Subscription Plans

You can create subscription plans via the admin API or directly in the database:

```sql
INSERT INTO subscription_plans (
  stripe_price_id,
  stripe_product_id,
  name,
  description,
  price,
  currency,
  interval,
  interval_count,
  trial_period_days,
  max_locations,
  max_team_members,
  features
) VALUES (
  'price_1234567890',  -- Your Stripe Price ID
  'prod_1234567890',   -- Your Stripe Product ID
  'Basic Plan',
  'Perfect for small businesses',
  29.99,
  'usd',
  'month',
  1,
  14,
  1,
  5,
  '["inventory_management", "voice_commands", "basic_analytics"]'::jsonb
);
```

## API Endpoints

### Public Endpoints

- `GET /api/subscriptions/plans` - Get all available subscription plans

### Authenticated Endpoints

- `POST /api/subscriptions/checkout` - Create Stripe checkout session
- `GET /api/subscriptions/current` - Get user's current subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `POST /api/subscriptions/reactivate` - Reactivate subscription
- `POST /api/subscriptions/portal` - Create customer portal session

### Webhook Endpoints

- `POST /api/subscriptions/webhook` - Stripe webhook handler

### Admin Endpoints

- `POST /api/subscriptions/admin/plans` - Create subscription plan
- `PUT /api/subscriptions/admin/plans/:id` - Update subscription plan

## Testing

### Test Credit Cards

Use these test card numbers in Stripe's test mode:

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- 3D Secure: `4000 0000 0000 3220`

### Test Webhooks

Use Stripe CLI to test webhooks locally:

```bash
# Install Stripe CLI
# Then forward events to your local server
stripe listen --forward-to localhost:8080/api/subscriptions/webhook
```

## Frontend Integration

Add these environment variables to your frontend `.env` file:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Production Deployment

1. Replace test keys with live keys
2. Update webhook endpoint to your production URL
3. Set up proper SSL/TLS for webhook security
4. Configure proper CORS settings
5. Set up monitoring for webhook failures
