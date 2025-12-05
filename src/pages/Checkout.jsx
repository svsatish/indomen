import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import CheckoutForm from '../components/CheckoutForm';
import './Checkout.css';

// Initialize Stripe (Replace with your actual publishable key)
const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const Checkout = () => {
    const { items, getTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [pickupLocation, setPickupLocation] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');
    const [clientSecret, setClientSecret] = useState('');

    const pickupLocations = [
        'Ashburn',
        'Centerville',
        'Herndon',
        'Fairfax'
    ];

    useEffect(() => {
        fetchSettings();
        // Create PaymentIntent when component mounts
        if (items.length > 0) {
            fetch('/api/payment/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: getTotal() }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.error) {
                        console.error('Stripe Error:', data.error);
                        setError('Payment system unavailable');
                    } else {
                        setClientSecret(data.clientSecret);
                    }
                })
                .catch((err) => {
                    console.error('Error creating payment intent:', err);
                    setError('Payment system unavailable');
                });
        }
    }, [items, getTotal]);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings');
            const data = await response.json();
            setSettings(data);

            if (!data.acceptingOrders) {
                setError('We are not currently accepting new orders. Please check back later.');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const handleOrderSuccess = async (paymentId) => {
        setLoading(true);
        setError('');

        try {
            const orderData = {
                items: items.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    unit: item.unit,
                    category: item.category
                })),
                total: getTotal(),
                pickupLocation,
                phone: user?.phone || '',
                notes,
                paymentId, // Store Stripe Payment ID
                paymentMethod: 'stripe'
            };

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create order');
            }

            const order = await response.json();
            clearCart();

            setToastMessage('Order placed successfully!');
            setToastType('success');
            setShowToast(true);

            // Delay navigation to show toast
            setTimeout(() => {
                navigate('/order-confirmation', { state: { order } });
            }, 2000);
        } catch (err) {
            console.error('Order creation error:', err);
            setError(err.message || 'Failed to place order. Please contact support.');
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0) {
        navigate('/cart');
        return null;
    }

    const appearance = {
        theme: 'stripe',
        variables: {
            colorPrimary: '#ed8936',
        },
    };

    const options = {
        clientSecret,
        appearance,
    };

    return (
        <div className="checkout-page">
            {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastType}
                    onClose={() => setShowToast(false)}
                />
            )}
            <div className="container container-narrow">
                <h1 className="page-title">Checkout</h1>

                <div className="checkout-content">
                    <div className="checkout-form-section">
                        <div className="checkout-form">
                            <h2>Pickup Information</h2>

                            {error && (
                                <div className="alert alert-error">{error}</div>
                            )}

                            <div className="form-group">
                                <label htmlFor="location" className="form-label">Pickup Location *</label>
                                <select
                                    id="location"
                                    value={pickupLocation}
                                    onChange={(e) => setPickupLocation(e.target.value)}
                                    className="form-select"
                                    required
                                >
                                    <option value="">Select a location...</option>
                                    {pickupLocations.map(location => (
                                        <option key={location} value={location}>{location}</option>
                                    ))}
                                </select>
                                <p className="help-text">Select the location where you'll pick up your order</p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="notes" className="form-label">Order Notes (Optional)</label>
                                <textarea
                                    id="notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="form-textarea"
                                    placeholder="Any special instructions..."
                                    rows="3"
                                />
                            </div>

                            <div className="payment-info card-glass">
                                <h3>💳 Secure Payment</h3>
                                {!pickupLocation ? (
                                    <div className="alert alert-warning">
                                        Please select a pickup location to proceed with payment.
                                    </div>
                                ) : (
                                    clientSecret ? (
                                        <Elements options={options} stripe={stripePromise}>
                                            <CheckoutForm
                                                amount={getTotal()}
                                                onSubmit={handleOrderSuccess}
                                            />
                                        </Elements>
                                    ) : (
                                        <div className="payment-placeholder">
                                            {error && error.includes('Payment system') ? (
                                                <div className="demo-payment">
                                                    <p className="text-error mb-md">
                                                        ⚠️ Stripe is not configured (Missing API Keys).
                                                    </p>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => handleOrderSuccess('demo_payment_id')}
                                                    >
                                                        Simulate Successful Payment (Demo)
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="loading-spinner">Loading payment options...</div>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="order-summary-section">
                        <div className="order-summary card">
                            <h2>Order Summary</h2>

                            <div className="summary-items">
                                {(() => {
                                    const groupedItems = items.reduce((acc, item) => {
                                        const category = item.category || 'misc';
                                        if (!acc[category]) acc[category] = [];
                                        acc[category].push(item);
                                        return acc;
                                    }, {});

                                    const categoryOrder = ['dairy', 'eggs', 'juices', 'bread', 'vegetables', 'fruits', 'misc'];
                                    const categoryNames = {
                                        dairy: '🥛 Dairy',
                                        eggs: '🥚 Eggs',
                                        juices: '🧃 Juices',
                                        bread: '🍞 Bread',
                                        vegetables: '🥬 Vegetables',
                                        fruits: '🍎 Fruits',
                                        misc: '📦 Misc'
                                    };

                                    return categoryOrder.map(category => {
                                        if (!groupedItems[category] || groupedItems[category].length === 0) return null;

                                        return (
                                            <div key={category} className="summary-category">
                                                <div className="category-label">{categoryNames[category]}</div>
                                                {groupedItems[category].map(item => (
                                                    <div key={item.id} className="summary-item">
                                                        <div className="summary-item-info">
                                                            <span className="item-name">{item.name}</span>
                                                            <span className="item-qty">× {item.quantity}</span>
                                                        </div>
                                                        <span className="item-price">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            <div className="summary-total">
                                <span>Total</span>
                                <span className="total-amount">${getTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
