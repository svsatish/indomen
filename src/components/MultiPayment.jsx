import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import './MultiPayment.css';

// Initialize Stripe
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

// Stripe Payment Form Component
const StripePaymentForm = ({ amount, onSuccess, onError, buttonText }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);
        setError('');

        try {
            const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/order-confirmation`,
                },
                redirect: 'if_required',
            });

            if (stripeError) {
                throw new Error(stripeError.message);
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                onSuccess(paymentIntent.id, 'stripe');
            } else {
                throw new Error('Payment was not completed');
            }
        } catch (err) {
            setError(err.message);
            onError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="stripe-payment-form">
            <PaymentElement
                id="payment-element"
                options={{
                    layout: 'accordion',
                    paymentMethodOrder: ['card', 'paypal', 'link', 'amazon_pay']
                }}
            />

            {error && <div className="payment-error-message">{error}</div>}

            <button
                type="submit"
                disabled={!stripe || !elements || processing}
                className="btn btn-primary payment-submit-btn"
            >
                {processing ? 'Processing...' : buttonText || `Pay $${amount.toFixed(2)}`}
            </button>
        </form>
    );
};

// PayPal Button Component (Native PayPal integration)
const PayPalButton = ({ amount, onSuccess, onError }) => {
    const [loading, setLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        // Check if PayPal script is available
        const checkPayPal = async () => {
            try {
                const response = await fetch('/api/payment/payment-methods', {
                    credentials: 'include'
                });
                const methods = await response.json();

                if (methods.paypal?.enabled && methods.paypal?.clientId) {
                    loadPayPalScript(methods.paypal.clientId);
                }
            } catch (error) {
                console.error('Failed to load PayPal config:', error);
            }
        };

        checkPayPal();
    }, []);

    const loadPayPalScript = (clientId) => {
        if (window.paypal) {
            setScriptLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);
    };

    const handlePayPalClick = async () => {
        if (!scriptLoaded || !window.paypal) {
            onError('PayPal is not available');
            return;
        }

        setLoading(true);
        try {
            // Create PayPal order
            const createResponse = await fetch('/api/payment/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amount })
            });

            const { orderId } = await createResponse.json();

            // Open PayPal popup
            window.paypal.Buttons({
                createOrder: () => orderId,
                onApprove: async (data) => {
                    const captureResponse = await fetch('/api/payment/paypal/capture-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ orderId: data.orderID })
                    });

                    const capture = await captureResponse.json();
                    if (capture.success) {
                        onSuccess(capture.paymentId, 'paypal');
                    } else {
                        throw new Error('PayPal capture failed');
                    }
                },
                onError: (err) => {
                    onError(err.message || 'PayPal payment failed');
                }
            }).render('#paypal-button-container');
        } catch (error) {
            onError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!scriptLoaded) {
        return null;
    }

    return (
        <div className="paypal-button-wrapper">
            <div id="paypal-button-container"></div>
        </div>
    );
};

// Main Multi-Payment Component
const MultiPayment = ({
    amount,
    onSuccess,
    onError,
    buttonText,
    showPaymentMethodSelector = true,
    clientSecret: externalClientSecret = null // Accept clientSecret from parent
}) => {
    const [clientSecret, setClientSecret] = useState(externalClientSecret || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('stripe'); // 'stripe', 'paypal', 'amazon'
    const [paymentMethods, setPaymentMethods] = useState(null);

    // Update clientSecret when external prop changes
    useEffect(() => {
        if (externalClientSecret) {
            setClientSecret(externalClientSecret);
        }
    }, [externalClientSecret]);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    useEffect(() => {
        // Only create payment intent if no external clientSecret was provided
        if (!externalClientSecret && amount > 0 && selectedMethod === 'stripe' && !clientSecret) {
            createPaymentIntent();
        }
    }, [amount, selectedMethod, externalClientSecret]);

    const fetchPaymentMethods = async () => {
        try {
            const response = await fetch('/api/payment/payment-methods', {
                credentials: 'include'
            });
            const methods = await response.json();
            setPaymentMethods(methods);
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
        }
    };

    const createPaymentIntent = async () => {
        setLoading(true);
        setError('');
        setClientSecret('');

        try {
            const response = await fetch('/api/payment/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ amount })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(data.error || 'Failed to initialize payment');
            }

            setClientSecret(data.clientSecret);
        } catch (err) {
            setError(err.message);
            onError?.(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (paymentId, method) => {
        onSuccess?.(paymentId, method);
    };

    const handlePaymentError = (errorMessage) => {
        setError(errorMessage);
        onError?.(errorMessage);
    };

    if (loading) {
        return (
            <div className="multi-payment-loading">
                <div className="payment-spinner"></div>
                <span>Initializing secure payment...</span>
            </div>
        );
    }

    return (
        <div className="multi-payment-container">
            {/* Payment Method Info Banner */}
            <div className="payment-methods-info">
                <h4>🔒 Secure Payment Options</h4>
                <p className="payment-methods-description">
                    We accept all major credit/debit cards, Apple Pay, Google Pay, and more.
                    Select your preferred payment method below.
                </p>
                <div className="accepted-methods-icons">
                    <span title="Visa">💳</span>
                    <span title="Mastercard">💳</span>
                    <span title="American Express">💳</span>
                    <span title="Apple Pay">🍎</span>
                    <span title="Google Pay">G</span>
                    {paymentMethods?.paypal?.enabled && <span title="PayPal">P</span>}
                </div>
            </div>

            {/* Payment Amount Display */}
            <div className="payment-amount-display">
                <span>Total to Pay:</span>
                <span className="amount">${amount.toFixed(2)}</span>
            </div>

            {error && (
                <div className="payment-error-banner">
                    <span>⚠️ {error}</span>
                    <button onClick={() => setError('')} className="dismiss-btn">×</button>
                </div>
            )}

            {/* Main Stripe Payment - includes cards, Apple Pay, Google Pay, Link, and PayPal (if enabled in Stripe) */}
            {clientSecret ? (
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                        appearance: {
                            theme: 'stripe',
                            variables: {
                                colorPrimary: '#22c55e',
                                fontFamily: '"Space Grotesk", sans-serif',
                            },
                        },
                    }}
                >
                    <StripePaymentForm
                        amount={amount}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        buttonText={buttonText}
                    />
                </Elements>
            ) : (
                <div className="multi-payment-loading">
                    <div className="payment-spinner"></div>
                    <span>Loading payment options...</span>
                </div>
            )}

            {/* Alternative Payment Methods - Native PayPal (if configured separately) */}
            {paymentMethods?.paypal?.enabled && selectedMethod === 'paypal' && (
                <div className="alternative-payment-section">
                    <div className="divider-with-text">
                        <span>Or pay with</span>
                    </div>
                    <PayPalButton
                        amount={amount}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                    />
                </div>
            )}

            {/* Secure Payment Badge */}
            <div className="secure-payment-badge">
                <span className="lock-icon">🔒</span>
                <span>Secured by 256-bit SSL encryption</span>
            </div>
        </div>
    );
};

export default MultiPayment;

