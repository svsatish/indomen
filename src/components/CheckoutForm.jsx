import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const CheckoutForm = ({ amount, onSubmit }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        try {
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/order-confirmation`,
                },
                redirect: 'if_required',
            });

            if (error) {
                setMessage(error.message);
                setIsLoading(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Payment succeeded, call parent handler
                await onSubmit(paymentIntent.id);
                // Note: onSubmit should handle navigation or success state
            } else {
                setMessage('Payment status: ' + (paymentIntent?.status || 'unknown'));
                setIsLoading(false);
            }
        } catch (e) {
            setMessage('An unexpected error occurred.');
            setIsLoading(false);
        }
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit} className="stripe-form">
            <PaymentElement id="payment-element" />
            <button
                disabled={isLoading || !stripe || !elements}
                id="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: '20px' }}
            >
                <span id="button-text">
                    {isLoading ? 'Processing...' : `Pay $${amount.toFixed(2)} & Place Order`}
                </span>
            </button>
            {message && (
                <div className="alert alert-error" style={{ marginTop: '20px' }}>
                    {message}
                </div>
            )}
        </form>
    );
};

export default CheckoutForm;
