import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Create payment intent with multiple payment method support
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'Amount is required' });
        }

        // Check if Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_placeholder' || process.env.STRIPE_SECRET_KEY === '') {
            console.warn('Stripe not configured - missing STRIPE_SECRET_KEY');
            return res.status(500).json({
                error: 'Payment system not configured. Please contact administrator.'
            });
        }

        // Create payment intent with automatic payment methods
        // This enables cards, Apple Pay, Google Pay, Link, and PayPal (if enabled in Stripe dashboard)
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                integration: 'indomen_marketplace'
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            availablePaymentMethods: ['card', 'link', 'paypal', 'amazon_pay']
        });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get available payment methods
router.get('/payment-methods', async (req, res) => {
    try {
        const methods = {
            stripe: {
                enabled: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder',
                methods: ['card', 'apple_pay', 'google_pay', 'link']
            },
            paypal: {
                enabled: !!process.env.PAYPAL_CLIENT_ID,
                clientId: process.env.PAYPAL_CLIENT_ID || null
            },
            amazonPay: {
                enabled: !!process.env.AMAZON_PAY_MERCHANT_ID,
                merchantId: process.env.AMAZON_PAY_MERCHANT_ID || null,
                region: process.env.AMAZON_PAY_REGION || 'us'
            }
        };

        res.json(methods);
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ error: error.message });
    }
});

// PayPal order creation endpoint
router.post('/paypal/create-order', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            return res.status(500).json({ error: 'PayPal not configured' });
        }

        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        const { access_token } = await tokenResponse.json();

        const orderResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: amount.toFixed(2)
                    }
                }]
            })
        });

        const order = await orderResponse.json();
        res.json({ orderId: order.id });
    } catch (error) {
        console.error('PayPal order creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PayPal order capture endpoint
router.post('/paypal/capture-order', async (req, res) => {
    try {
        const { orderId } = req.body;

        if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
            return res.status(500).json({ error: 'PayPal not configured' });
        }

        const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');
        const tokenResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=client_credentials'
        });

        const { access_token } = await tokenResponse.json();

        const captureResponse = await fetch(`${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });

        const capture = await captureResponse.json();

        if (capture.status === 'COMPLETED') {
            res.json({
                success: true,
                paymentId: capture.id,
                status: capture.status
            });
        } else {
            res.status(400).json({ error: 'Payment not completed', status: capture.status });
        }
    } catch (error) {
        console.error('PayPal capture error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Amazon Pay session creation
router.post('/amazon-pay/create-session', async (req, res) => {
    try {
        const { amount } = req.body;

        if (!process.env.AMAZON_PAY_MERCHANT_ID || !process.env.AMAZON_PAY_PUBLIC_KEY_ID) {
            return res.status(500).json({ error: 'Amazon Pay not configured' });
        }

        res.json({
            merchantId: process.env.AMAZON_PAY_MERCHANT_ID,
            publicKeyId: process.env.AMAZON_PAY_PUBLIC_KEY_ID,
            ledgerCurrency: 'USD',
            amount: amount
        });
    } catch (error) {
        console.error('Amazon Pay session error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
