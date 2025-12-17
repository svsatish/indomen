# 💳 Payment Integration Guide

This document explains how to set up and configure the multiple payment methods available in the Indomen Connection marketplace.

## Supported Payment Methods

All payment methods are handled through **Stripe**, which provides a unified payment experience:

1. **Credit/Debit Cards** - Visa, Mastercard, American Express, Discover
2. **Apple Pay** - Automatically available on Apple devices
3. **Google Pay** - Automatically available on Android/Chrome
4. **Link** - Stripe's fast checkout (saves card for future use)
5. **PayPal** - Must be enabled in Stripe Dashboard
6. **Amazon Pay** - Must be enabled in Stripe Dashboard

---

## Quick Setup (Enable All Payment Methods)

### Step 1: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create an account or log in
3. Navigate to **Developers** → **API Keys**
4. Copy your keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 2: Configure Your Server

Add to your `server/.env` file:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

### Step 3: Update Frontend (if needed)

The Stripe publishable key is in:
- `src/components/MultiPayment.jsx` - Line with `loadStripe('pk_test_...')`

### Step 4: Enable Additional Payment Methods in Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Payment Methods**
3. Enable the payment methods you want:
   - ✅ **Cards** (enabled by default)
   - ✅ **Apple Pay** (enabled by default)
   - ✅ **Google Pay** (enabled by default)  
   - ✅ **Link** (enabled by default)
   - 🔘 **PayPal** - Click to enable and connect your PayPal account
   - 🔘 **Amazon Pay** - Click to enable and connect your Amazon account

Once enabled in Stripe Dashboard, these payment methods will **automatically appear** in the checkout!

---

## Native PayPal Integration (Optional)

If you want to use PayPal directly (not through Stripe), configure these settings:

### Getting PayPal API Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/applications/sandbox)
2. Create a REST API app or use the default sandbox app
3. Copy your credentials:
   - **Client ID**
   - **Client Secret**

### Configuration

Add to your `server/.env` file:

```env
# For Sandbox (Testing)
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_API_URL=https://api-m.sandbox.paypal.com

# For Production (Live)
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_API_URL=https://api-m.paypal.com
```

---

## Amazon Pay Configuration (Optional)

For direct Amazon Pay integration:

### Getting Amazon Pay Credentials

1. Go to [Amazon Seller Central](https://sellercentral.amazon.com)
2. Register for Amazon Pay
3. Navigate to **Integration** → **Integration Central**
4. Get your credentials:
   - **Merchant ID**
   - **Public Key ID**
   - **Private Key** (for signing requests)

### Configuration

Add to your `server/.env` file:

```env
AMAZON_PAY_MERCHANT_ID=your_merchant_id
AMAZON_PAY_PUBLIC_KEY_ID=your_public_key_id
AMAZON_PAY_REGION=us
```

---

## Testing Payments

### Stripe Test Cards

Use these test card numbers in sandbox mode:

| Card Number | Description |
|-------------|-------------|
| 4242 4242 4242 4242 | Successful payment |
| 4000 0000 0000 3220 | 3D Secure required |
| 4000 0000 0000 9995 | Declined card |

- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

### PayPal Sandbox

1. Create sandbox buyer and seller accounts at PayPal Developer Dashboard
2. Use sandbox buyer credentials to test payments

---

## Payment Flow

### Checkout Flow

```
1. User adds items to cart
2. User goes to Checkout page
3. User selects pickup location
4. Payment options are displayed (via Stripe PaymentElement)
5. User completes payment
6. Order is created and confirmed
```

### Balance Payment Flow

```
1. Admin charges customer (debit balance created)
2. User sees "Pay Balance" button in header
3. User goes to Pay Balance page
4. User selects payment amount (full or partial)
5. User completes payment
6. Balance is updated
```

---

## API Endpoints

### Stripe
- `POST /api/payment/create-payment-intent` - Create payment intent
- `GET /api/payment/payment-methods` - Get available payment methods

### PayPal
- `POST /api/payment/paypal/create-order` - Create PayPal order
- `POST /api/payment/paypal/capture-order` - Capture PayPal payment

### Amazon Pay
- `POST /api/payment/amazon-pay/create-session` - Create checkout session

---

## Security Considerations

1. **Never expose secret keys** - Keep `STRIPE_SECRET_KEY` and `PAYPAL_CLIENT_SECRET` server-side only
2. **Use HTTPS** in production
3. **Validate webhooks** - Set up Stripe webhooks for payment confirmation
4. **PCI Compliance** - Stripe handles PCI compliance when using their elements
5. **Price Validation** - Server validates prices to prevent manipulation

---

## Troubleshooting

### "Payment system not configured"
- Check that `STRIPE_SECRET_KEY` is set in `.env`
- Restart the server after changing `.env`

### "PayPal not configured"
- Check that `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set
- Verify PayPal sandbox/live environment matches your credentials

### Payment stuck on "Processing"
- Check browser console for errors
- Verify network connectivity
- Check server logs for API errors

### Apple Pay / Google Pay not showing
- These only appear on supported devices/browsers
- Must be served over HTTPS (except localhost)

---

## Support

For payment-related issues:
- Stripe: https://support.stripe.com
- PayPal: https://www.paypal.com/us/smarthelp/contact-us
- Amazon Pay: https://pay.amazon.com/help

